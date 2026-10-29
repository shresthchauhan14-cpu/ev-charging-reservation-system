import { Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../../database/db.js';
import { allocateReleasedSlot } from '../waiting-list/waiting-list.service.js';
import { runMigrations } from '../../database/migrate.js';
import { runSeeds } from '../../database/seed.js';

export const createStationSchema = z.object({
  name: z.string().min(3),
  description: z.string().optional(),
  address: z.string().min(5),
  city: z.string().min(2),
  latitude: z.number(),
  longitude: z.number(),
  openingTime: z.string().optional(),
  closingTime: z.string().optional(),
});

export const updateStationSchema = createStationSchema.partial().extend({
  operatingStatus: z.enum(['OPERATIONAL', 'MAINTENANCE', 'DECOMMISSIONED']).optional(),
});

export const createChargingPointSchema = z.object({
  pointCode: z.string().min(2),
  connectorType: z.enum(['CCS2', 'TYPE2', 'GBT']),
  powerKw: z.number().positive(),
  pricePerKwh: z.number().positive(),
  operationalStatus: z.enum(['AVAILABLE', 'OCCUPIED', 'RESERVED', 'OUT_OF_SERVICE']).optional(),
});

export const updateChargingPointSchema = createChargingPointSchema.partial();

export async function getAdminDashboard(req: Request, res: Response): Promise<void> {
  // Query actual counts from PostgreSQL
  const stationsCount = await db.query('SELECT COUNT(*) AS count FROM charging_stations');
  const pointsCount = await db.query('SELECT COUNT(*) AS count FROM charging_points');
  const availablePointsCount = await db.query("SELECT COUNT(*) AS count FROM charging_points WHERE operational_status = 'AVAILABLE'");
  const activeResCount = await db.query("SELECT COUNT(*) AS count FROM reservations WHERE status IN ('CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS')");
  const cancelledResCount = await db.query("SELECT COUNT(*) AS count FROM reservations WHERE status = 'CANCELLED'");
  const completedResCount = await db.query("SELECT COUNT(*) AS count FROM reservations WHERE status = 'COMPLETED'");
  const noshowResCount = await db.query("SELECT COUNT(*) AS count FROM reservations WHERE status = 'NO_SHOW'");
  const waitlistCount = await db.query("SELECT COUNT(*) AS count FROM waiting_list_entries WHERE status = 'QUEUED'");
  
  const recentAudit = await db.query(`
    SELECT a.id, a.action, a.entity_type, a.entity_id, a.details, a.created_at, u.full_name AS actor_name
    FROM audit_logs a
    LEFT JOIN users u ON a.actor_user_id = u.id
    ORDER BY a.created_at DESC
    LIMIT 10
  `);

  res.json({
    success: true,
    data: {
      metrics: {
        totalStations: parseInt(stationsCount.rows[0].count, 10),
        totalChargingPoints: parseInt(pointsCount.rows[0].count, 10),
        availableChargingPoints: parseInt(availablePointsCount.rows[0].count, 10),
        activeReservations: parseInt(activeResCount.rows[0].count, 10),
        cancelledReservations: parseInt(cancelledResCount.rows[0].count, 10),
        completedReservations: parseInt(completedResCount.rows[0].count, 10),
        noShowReservations: parseInt(noshowResCount.rows[0].count, 10),
        waitingListEntries: parseInt(waitlistCount.rows[0].count, 10),
      },
      recentActivity: recentAudit.rows,
      databaseEngine: db.getEngineMode(),
    },
  });
}

export async function createStation(req: Request, res: Response): Promise<void> {
  const adminId = req.user!.id;
  const { name, description, address, city, latitude, longitude, openingTime, closingTime } = req.body;

  const result = await db.query(
    `INSERT INTO charging_stations (name, description, address, city, latitude, longitude, opening_time, closing_time)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      name,
      description || null,
      address,
      city,
      latitude,
      longitude,
      openingTime || '06:00:00',
      closingTime || '23:00:00',
    ]
  );

  const station = result.rows[0];

  await db.query(
    `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, details)
     VALUES ($1, 'CREATE_STATION', 'STATION', $2, $3)`,
    [adminId, station.id.toString(), JSON.stringify({ name, city })]
  );

  res.status(201).json({ success: true, data: { station } });
}

export async function updateStation(req: Request, res: Response): Promise<void> {
  const stationId = parseInt(req.params.id, 10);
  const adminId = req.user!.id;
  const { name, description, address, city, latitude, longitude, operatingStatus, openingTime, closingTime } = req.body;

  const result = await db.query(
    `UPDATE charging_stations
     SET name = COALESCE($1, name),
         description = COALESCE($2, description),
         address = COALESCE($3, address),
         city = COALESCE($4, city),
         latitude = COALESCE($5, latitude),
         longitude = COALESCE($6, longitude),
         operating_status = COALESCE($7, operating_status),
         opening_time = COALESCE($8, opening_time),
         closing_time = COALESCE($9, closing_time),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $10
     RETURNING *`,
    [name, description, address, city, latitude, longitude, operatingStatus, openingTime, closingTime, stationId]
  );

  if (result.rowCount === 0) {
    res.status(404).json({ success: false, error: { message: 'Station not found.' } });
    return;
  }

  await db.query(
    `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, details)
     VALUES ($1, 'UPDATE_STATION', 'STATION', $2, $3)`,
    [adminId, stationId.toString(), JSON.stringify({ name, operatingStatus })]
  );

  res.json({ success: true, data: { station: result.rows[0] } });
}

export async function addChargingPoint(req: Request, res: Response): Promise<void> {
  const stationId = parseInt(req.params.id, 10);
  const adminId = req.user!.id;
  const { pointCode, connectorType, powerKw, pricePerKwh, operationalStatus } = req.body;

  const result = await db.query(
    `INSERT INTO charging_points (station_id, point_code, connector_type, power_kw, price_per_kwh, operational_status)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [stationId, pointCode, connectorType, powerKw, pricePerKwh, operationalStatus || 'AVAILABLE']
  );

  const point = result.rows[0];

  await db.query(
    `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, details)
     VALUES ($1, 'CREATE_CHARGING_POINT', 'CHARGING_POINT', $2, $3)`,
    [adminId, point.id.toString(), JSON.stringify({ stationId, pointCode, connectorType })]
  );

  res.status(201).json({ success: true, data: { chargingPoint: point } });
}

export async function updateChargingPoint(req: Request, res: Response): Promise<void> {
  const pointId = parseInt(req.params.id, 10);
  const adminId = req.user!.id;
  const { pointCode, connectorType, powerKw, pricePerKwh, operationalStatus } = req.body;

  const result = await db.query(
    `UPDATE charging_points
     SET point_code = COALESCE($1, point_code),
         connector_type = COALESCE($2, connector_type),
         power_kw = COALESCE($3, power_kw),
         price_per_kwh = COALESCE($4, price_per_kwh),
         operational_status = COALESCE($5, operational_status),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $6
     RETURNING *`,
    [pointCode, connectorType, powerKw, pricePerKwh, operationalStatus, pointId]
  );

  if (result.rowCount === 0) {
    res.status(404).json({ success: false, error: { message: 'Charging point not found.' } });
    return;
  }

  await db.query(
    `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, details)
     VALUES ($1, 'UPDATE_CHARGING_POINT', 'CHARGING_POINT', $2, $3)`,
    [adminId, pointId.toString(), JSON.stringify({ operationalStatus, pricePerKwh })]
  );

  res.json({ success: true, data: { chargingPoint: result.rows[0] } });
}

export async function simulateNoShow(req: Request, res: Response): Promise<void> {
  const reservationId = parseInt(req.params.id, 10);
  const adminId = req.user!.id;

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

      if (resv.status !== 'CONFIRMED') {
        throw { status: 400, message: `Only CONFIRMED bookings can be marked NO_SHOW. Current status: ${resv.status}` };
      }

      await tx.query(
        "UPDATE reservations SET status = 'NO_SHOW', updated_at = CURRENT_TIMESTAMP WHERE id = $1",
        [reservationId]
      );

      await tx.query(
        `INSERT INTO cancellation_and_no_show_records (
           reservation_id, user_id, event_type, reason, administrative_action
         )
         VALUES ($1, $2, 'NO_SHOW_SYSTEM', 'Exceeded 15-minute check-in grace period', 'Slot automatically released by system')`,
        [reservationId, resv.user_id]
      );

      await tx.query(
        `INSERT INTO notifications (user_id, title, message, type)
         VALUES ($1, 'Reservation Marked No-Show', $2, 'ERROR')`,
        [resv.user_id, `Reservation ${resv.booking_reference} was cancelled due to no-show past the grace window.`]
      );

      await tx.query(
        `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, details)
         VALUES ($1, 'SIMULATE_NO_SHOW', 'RESERVATION', $2, $3)`,
        [adminId, reservationId.toString(), JSON.stringify({ reference: resv.booking_reference })]
      );

      return resv;
    });

    // Post no-show: trigger smart waiting list allocation
    const allocationResult = await allocateReleasedSlot(
      outcome.charging_point_id,
      new Date(outcome.start_time),
      new Date(outcome.end_time)
    );

    res.json({
      success: true,
      message: `Reservation ${outcome.booking_reference} marked as NO-SHOW. Slot released and evaluated against waiting list.`,
      data: {
        reservationId: outcome.id,
        reallocationResult: allocationResult,
      },
    });
  } catch (err: any) {
    if (err.status) {
      res.status(err.status).json({ success: false, error: { message: err.message } });
      return;
    }
    console.error('Error simulating no-show:', err);
    res.status(500).json({ success: false, error: { message: 'Database error simulating no-show.' } });
  }
}

export async function resetDemoData(req: Request, res: Response): Promise<void> {
  const adminId = req.user!.id;

  // Protect production databases against destructive demo resets
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_PROD_DEMO_RESET !== 'true') {
    res.status(403).json({
      success: false,
      error: { message: 'Database reset is strictly disabled in production environments for safety.' },
    });
    return;
  }

  try {
    console.log('[Admin] Resetting demo database to initial state...');
    await runMigrations();
    await runSeeds();

    await db.query(
      `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, details)
       VALUES ($1, 'DATABASE_RESET_DEMO_DATA', 'SYSTEM', '0', 'Admin re-executed migrations and seed data for live demonstration')`,
      [adminId]
    );

    res.json({
      success: true,
      message: 'Demo database has been successfully re-initialized with standard demonstration records.',
    });
  } catch (err: any) {
    console.error('Error resetting demo database:', err);
    res.status(500).json({ success: false, error: { message: 'Failed to reset demo database.' } });
  }
}

export async function getAnalytics(req: Request, res: Response): Promise<void> {
  // 1. Station utilization
  const utilizationRes = await db.query(`
    SELECT 
      s.name AS station_name,
      COUNT(cp.id) AS total_points,
      COUNT(CASE WHEN cp.operational_status = 'AVAILABLE' THEN 1 END) AS available_points,
      COUNT(CASE WHEN cp.operational_status = 'OCCUPIED' THEN 1 END) AS occupied_points,
      COUNT(CASE WHEN cp.operational_status = 'RESERVED' THEN 1 END) AS reserved_points,
      ROUND(
        (COUNT(CASE WHEN cp.operational_status IN ('OCCUPIED', 'RESERVED') THEN 1 END)::NUMERIC / 
        NULLIF(COUNT(cp.id), 0)) * 100, 1
      ) AS utilization_rate_percent
    FROM charging_stations s
    JOIN charging_points cp ON s.id = cp.station_id
    GROUP BY s.id, s.name
    ORDER BY s.id ASC
  `);

  // 2. Connector type demand
  const connectorRes = await db.query(`
    SELECT cp.connector_type, COUNT(r.id) AS booking_count
    FROM charging_points cp
    LEFT JOIN reservations r ON cp.id = r.charging_point_id
    GROUP BY cp.connector_type
    ORDER BY booking_count DESC
  `);

  // 3. Status breakdown
  const statusRes = await db.query(`
    SELECT status, COUNT(*) AS count
    FROM reservations
    GROUP BY status
  `);

  res.json({
    success: true,
    data: {
      stationUtilization: utilizationRes.rows,
      connectorDemand: connectorRes.rows,
      reservationStatusBreakdown: statusRes.rows,
    },
  });
}

