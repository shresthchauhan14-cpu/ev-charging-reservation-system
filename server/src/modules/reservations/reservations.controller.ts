import { Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../../database/db.js';
import { allocateReleasedSlot } from '../waiting-list/waiting-list.service.js';

export const createReservationSchema = z.object({
  chargingPointId: z.number().int().positive(),
  vehicleId: z.number().int().positive().optional().nullable(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
});

export const cancelReservationSchema = z.object({
  reason: z.string().optional(),
});

export async function createReservation(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;
  const { chargingPointId, vehicleId, startTime, endTime } = req.body;

  const start = new Date(startTime);
  const end = new Date(endTime);

  if (end <= start) {
    res.status(400).json({
      success: false,
      error: { message: 'Invalid time window: End time must be later than start time.' },
    });
    return;
  }

  // Validate minimum duration (15 mins) and maximum duration (6 hours)
  const durationMs = end.getTime() - start.getTime();
  if (durationMs < 15 * 60 * 1000) {
    res.status(400).json({
      success: false,
      error: { message: 'Reservation duration must be at least 15 minutes.' },
    });
    return;
  }
  if (durationMs > 6 * 60 * 60 * 1000) {
    res.status(400).json({
      success: false,
      error: { message: 'Reservation duration cannot exceed 6 hours.' },
    });
    return;
  }

  try {
    const reservation = await db.transaction(async (tx) => {
      // 1. Verify charging point and station
      const pointRes = await tx.query(
        `SELECT cp.id, cp.point_code, cp.power_kw, cp.price_per_kwh, cp.operational_status,
                s.id AS station_id, s.name AS station_name, s.opening_time, s.closing_time, s.operating_status AS station_status
         FROM charging_points cp
         JOIN charging_stations s ON cp.station_id = s.id
         WHERE cp.id = $1`,
        [chargingPointId]
      );

      if (pointRes.rowCount === 0) {
        throw { status: 404, message: 'Charging point not found.' };
      }

      const point = pointRes.rows[0];

      if (point.station_status !== 'OPERATIONAL') {
        throw { status: 400, message: `Station is currently ${point.station_status}. Reservations unavailable.` };
      }

      if (point.operational_status === 'OUT_OF_SERVICE') {
        throw { status: 400, message: 'This charging point is currently out of service for maintenance.' };
      }

      // 2. Verify vehicle ownership if provided
      if (vehicleId) {
        const vehicleRes = await tx.query(
          'SELECT id FROM vehicles WHERE id = $1 AND user_id = $2',
          [vehicleId, userId]
        );
        if (vehicleRes.rowCount === 0) {
          throw { status: 403, message: 'Selected vehicle does not belong to your account.' };
        }
      }

      // 3. Concurrency Protection & Overlap Detection
      // Standard half-open interval overlap check: newStart < existingEnd AND newEnd > existingStart
      const conflictRes = await tx.query(
        `SELECT id, booking_reference, start_time, end_time, status
         FROM reservations
         WHERE charging_point_id = $1
           AND status IN ('CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS')
           AND (start_time < $3 AND end_time > $2)`,
        [chargingPointId, start.toISOString(), end.toISOString()]
      );

      if (conflictRes.rowCount > 0) {
        const conflict = conflictRes.rows[0];
        throw {
          status: 409,
          message: `Slot Conflict: Charging point ${point.point_code} is already reserved for this interval (Booking ${conflict.booking_reference}).`,
          details: {
            conflictingReference: conflict.booking_reference,
            conflictStart: conflict.start_time,
            conflictEnd: conflict.end_time,
          },
        };
      }

      // 4. Calculate estimated energy & cost
      const durationHours = durationMs / (1000 * 60 * 60);
      const powerKw = parseFloat(point.power_kw);
      const pricePerKwh = parseFloat(point.price_per_kwh);
      const estimatedEnergyKwh = Math.round(powerKw * durationHours * 0.85 * 100) / 100;
      const estimatedCost = Math.round(estimatedEnergyKwh * pricePerKwh * 100) / 100;

      // 5. Generate secure unique booking reference
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const bookingReference = `EV-IILM-${Date.now().toString(36).toUpperCase()}-${randomSuffix}`;

      // 6. Insert Reservation
      const insertRes = await tx.query(
        `INSERT INTO reservations (
           booking_reference, user_id, vehicle_id, charging_point_id,
           start_time, end_time, status, estimated_energy_kwh, estimated_cost
         )
         VALUES ($1, $2, $3, $4, $5, $6, 'CONFIRMED', $7, $8)
         RETURNING *`,
        [
          bookingReference,
          userId,
          vehicleId || null,
          chargingPointId,
          start.toISOString(),
          end.toISOString(),
          estimatedEnergyKwh,
          estimatedCost,
        ]
      );

      const created = insertRes.rows[0];

      // 7. Insert In-App Notification
      await tx.query(
        `INSERT INTO notifications (user_id, title, message, type)
         VALUES ($1, 'Reservation Confirmed', $2, 'SUCCESS')`,
        [
          userId,
          `Booking ${bookingReference} at ${point.station_name} (${point.point_code}) is confirmed for ${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
        ]
      );

      // 8. Audit Log
      await tx.query(
        `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, details)
         VALUES ($1, 'RESERVATION_CREATED', 'RESERVATION', $2, $3)`,
        [userId, created.id.toString(), JSON.stringify({ reference: bookingReference, pointCode: point.point_code })]
      );

      return {
        ...created,
        stationName: point.station_name,
        pointCode: point.point_code,
        powerKw,
        pricePerKwh,
      };
    });

    res.status(201).json({ success: true, data: { reservation } });
  } catch (err: any) {
    if (err.status) {
      res.status(err.status).json({
        success: false,
        error: { message: err.message, details: err.details },
      });
      return;
    }
    console.error('Error creating reservation:', err);
    res.status(500).json({ success: false, error: { message: 'Database error creating reservation.' } });
  }
}

export async function getReservations(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;
  const userRole = req.user!.role;
  const { status, all } = req.query as { status?: string; all?: string };

  let sql = `
    SELECT 
      r.id,
      r.booking_reference,
      r.user_id,
      u.full_name AS user_name,
      u.email AS user_email,
      r.charging_point_id,
      cp.point_code,
      cp.connector_type,
      cp.power_kw,
      s.id AS station_id,
      s.name AS station_name,
      s.address AS station_address,
      v.vehicle_name,
      v.registration_number,
      r.start_time,
      r.end_time,
      r.status,
      r.cancellation_reason,
      r.estimated_energy_kwh,
      r.estimated_cost,
      r.created_at
    FROM reservations r
    JOIN users u ON r.user_id = u.id
    JOIN charging_points cp ON r.charging_point_id = cp.id
    JOIN charging_stations s ON cp.station_id = s.id
    LEFT JOIN vehicles v ON r.vehicle_id = v.id
    WHERE 1=1
  `;
  const params: any[] = [];
  let paramIdx = 1;

  // Regular users only see their own reservations
  if (userRole !== 'ADMIN' || all !== 'true') {
    sql += ` AND r.user_id = $${paramIdx}`;
    params.push(userId);
    paramIdx++;
  }

  if (status) {
    sql += ` AND r.status = $${paramIdx}`;
    params.push(status.toUpperCase());
    paramIdx++;
  }

  sql += ` ORDER BY r.start_time DESC`;

  const result = await db.query(sql, params);

  const reservations = result.rows.map((row) => ({
    id: row.id,
    bookingReference: row.booking_reference,
    userId: row.user_id,
    userName: row.user_name,
    userEmail: row.user_email,
    chargingPointId: row.charging_point_id,
    pointCode: row.point_code,
    connectorType: row.connector_type,
    powerKw: parseFloat(row.power_kw),
    stationId: row.station_id,
    stationName: row.station_name,
    stationAddress: row.station_address,
    vehicleName: row.vehicle_name,
    registrationNumber: row.registration_number,
    startTime: row.start_time,
    endTime: row.end_time,
    status: row.status,
    cancellationReason: row.cancellation_reason,
    estimatedEnergyKwh: parseFloat(row.estimated_energy_kwh || '0'),
    estimatedCost: parseFloat(row.estimated_cost || '0'),
    createdAt: row.created_at,
  }));

  res.json({ success: true, data: { reservations } });
}

export async function getReservationById(req: Request, res: Response): Promise<void> {
  const reservationId = parseInt(req.params.id, 10);
  const userId = req.user!.id;
  const userRole = req.user!.role;

  const result = await db.query(
    `SELECT 
      r.id,
      r.booking_reference,
      r.user_id,
      u.full_name AS user_name,
      u.email AS user_email,
      r.charging_point_id,
      cp.point_code,
      cp.connector_type,
      cp.power_kw,
      s.id AS station_id,
      s.name AS station_name,
      s.address AS station_address,
      v.vehicle_name,
      v.registration_number,
      r.start_time,
      r.end_time,
      r.status,
      r.cancellation_reason,
      r.estimated_energy_kwh,
      r.estimated_cost,
      r.created_at
    FROM reservations r
    JOIN users u ON r.user_id = u.id
    JOIN charging_points cp ON r.charging_point_id = cp.id
    JOIN charging_stations s ON cp.station_id = s.id
    LEFT JOIN vehicles v ON r.vehicle_id = v.id
    WHERE r.id = $1`,
    [reservationId]
  );

  if (result.rowCount === 0) {
    res.status(404).json({ success: false, error: { message: 'Reservation not found.' } });
    return;
  }

  const row = result.rows[0];

  if (userRole !== 'ADMIN' && row.user_id !== userId) {
    res.status(403).json({ success: false, error: { message: 'Unauthorized to view this reservation.' } });
    return;
  }

  res.json({
    success: true,
    data: {
      reservation: {
        id: row.id,
        bookingReference: row.booking_reference,
        userId: row.user_id,
        userName: row.user_name,
        userEmail: row.user_email,
        chargingPointId: row.charging_point_id,
        pointCode: row.point_code,
        connectorType: row.connector_type,
        powerKw: parseFloat(row.power_kw),
        stationId: row.station_id,
        stationName: row.station_name,
        stationAddress: row.station_address,
        vehicleName: row.vehicle_name,
        registrationNumber: row.registration_number,
        startTime: row.start_time,
        endTime: row.end_time,
        status: row.status,
        cancellationReason: row.cancellation_reason,
        estimatedEnergyKwh: parseFloat(row.estimated_energy_kwh || '0'),
        estimatedCost: parseFloat(row.estimated_cost || '0'),
        createdAt: row.created_at,
      },
    },
  });
}

export async function cancelReservation(req: Request, res: Response): Promise<void> {
  const reservationId = parseInt(req.params.id, 10);
  const userId = req.user!.id;
  const userRole = req.user!.role;
  const { reason } = req.body;

  try {
    const outcome = await db.transaction(async (tx) => {
      const resCheck = await tx.query(
        'SELECT id, user_id, charging_point_id, start_time, end_time, status, booking_reference FROM reservations WHERE id = $1',
        [reservationId]
      );

      if (resCheck.rowCount === 0) {
        throw { status: 404, message: 'Reservation not found.' };
      }

      const resv = resCheck.rows[0];

      if (userRole !== 'ADMIN' && resv.user_id !== userId) {
        throw { status: 403, message: 'Unauthorized: You can only cancel your own reservations.' };
      }

      if (resv.status === 'CANCELLED') {
        throw { status: 400, message: 'This reservation is already cancelled.' };
      }

      if (resv.status === 'COMPLETED' || resv.status === 'NO_SHOW') {
        throw { status: 400, message: `Cannot cancel a reservation with status ${resv.status}.` };
      }

      // Update reservation status
      await tx.query(
        `UPDATE reservations 
         SET status = 'CANCELLED',
             cancellation_reason = $1,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [reason || 'Cancelled by user request', reservationId]
      );

      // Record cancellation audit
      await tx.query(
        `INSERT INTO cancellation_and_no_show_records (
           reservation_id, user_id, event_type, reason, administrative_action
         )
         VALUES ($1, $2, $3, $4, $5)`,
        [
          reservationId,
          resv.user_id,
          userRole === 'ADMIN' ? 'CANCELLED_BY_ADMIN' : 'CANCELLED_BY_USER',
          reason || 'User cancelled reservation',
          userRole === 'ADMIN' ? `Admin ID ${userId} cancelled` : null,
        ]
      );

      // In-app notification
      await tx.query(
        `INSERT INTO notifications (user_id, title, message, type)
         VALUES ($1, 'Reservation Cancelled', $2, 'WARNING')`,
        [resv.user_id, `Reservation ${resv.booking_reference} has been successfully cancelled.`]
      );

      // Audit log
      await tx.query(
        `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, details)
         VALUES ($1, 'RESERVATION_CANCELLED', 'RESERVATION', $2, $3)`,
        [userId, reservationId.toString(), JSON.stringify({ reference: resv.booking_reference, reason })]
      );

      return {
        id: resv.id,
        chargingPointId: resv.charging_point_id,
        startTime: resv.start_time,
        endTime: resv.end_time,
        bookingReference: resv.booking_reference,
      };
    });

    // Post-cancellation: Trigger intelligent waiting-list slot reallocation
    let allocationResult = null;
    try {
      allocationResult = await allocateReleasedSlot(
        outcome.chargingPointId,
        new Date(outcome.startTime),
        new Date(outcome.endTime)
      );
    } catch (allocErr) {
      console.warn('Auto waiting-list allocation check completed:', allocErr);
    }

    res.json({
      success: true,
      message: 'Reservation cancelled successfully. Slot has been returned to availability.',
      data: {
        reservationId: outcome.id,
        bookingReference: outcome.bookingReference,
        reallocatedToWaitingList: allocationResult?.allocated ?? false,
        reallocationDetails: allocationResult,
      },
    });
  } catch (err: any) {
    if (err.status) {
      res.status(err.status).json({ success: false, error: { message: err.message } });
      return;
    }
    console.error('Error cancelling reservation:', err);
    res.status(500).json({ success: false, error: { message: 'Database error cancelling reservation.' } });
  }
}

export async function checkInReservation(req: Request, res: Response): Promise<void> {
  const reservationId = parseInt(req.params.id, 10);
  const userId = req.user!.id;
  const userRole = req.user!.role;

  const resCheck = await db.query(
    'SELECT id, user_id, status, booking_reference FROM reservations WHERE id = $1',
    [reservationId]
  );

  if (resCheck.rowCount === 0) {
    res.status(404).json({ success: false, error: { message: 'Reservation not found.' } });
    return;
  }

  const resv = resCheck.rows[0];

  if (userRole !== 'ADMIN' && resv.user_id !== userId) {
    res.status(403).json({ success: false, error: { message: 'Unauthorized.' } });
    return;
  }

  if (resv.status !== 'CONFIRMED') {
    res.status(400).json({ success: false, error: { message: `Cannot check in. Current status: ${resv.status}` } });
    return;
  }

  await db.query(
    "UPDATE reservations SET status = 'CHECKED_IN', updated_at = CURRENT_TIMESTAMP WHERE id = $1",
    [reservationId]
  );

  // Start charging session
  await db.query(
    "INSERT INTO charging_sessions (reservation_id, session_status) VALUES ($1, 'ACTIVE')",
    [reservationId]
  );

  res.json({
    success: true,
    message: `Checked in successfully for booking ${resv.booking_reference}. Charging session initiated.`,
  });
}

