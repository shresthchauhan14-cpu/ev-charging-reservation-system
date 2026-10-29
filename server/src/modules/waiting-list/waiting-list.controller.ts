import { Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../../database/db.js';
import { calculatePriorityScore, allocateReleasedSlot } from './waiting-list.service.js';

export const joinWaitingListSchema = z.object({
  chargingPointId: z.number().int().positive(),
  requestedStartTime: z.string().datetime(),
  requestedEndTime: z.string().datetime(),
  stateOfChargePercent: z.number().min(0).max(100),
});

export async function joinWaitingList(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;
  const { chargingPointId, requestedStartTime, requestedEndTime, stateOfChargePercent } = req.body;

  const start = new Date(requestedStartTime);
  const end = new Date(requestedEndTime);

  if (end <= start) {
    res.status(400).json({
      success: false,
      error: { message: 'Invalid interval: End time must be later than start time.' },
    });
    return;
  }

  // Check charging point exists
  const cpRes = await db.query(
    `SELECT cp.id, cp.point_code, s.name AS station_name
     FROM charging_points cp
     JOIN charging_stations s ON cp.station_id = s.id
     WHERE cp.id = $1`,
    [chargingPointId]
  );

  if (cpRes.rowCount === 0) {
    res.status(404).json({ success: false, error: { message: 'Charging point not found.' } });
    return;
  }

  // Prevent multiple active waiting-list entries for the exact same point & time
  const existingRes = await db.query(
    `SELECT id FROM waiting_list_entries
     WHERE user_id = $1 AND charging_point_id = $2 AND status = 'QUEUED'`,
    [userId, chargingPointId]
  );

  if (existingRes.rowCount > 0) {
    res.status(400).json({
      success: false,
      error: { message: 'You already have an active waiting list entry for this charging point.' },
    });
    return;
  }

  // Calculate default reliability score based on past bookings (completed vs no-show)
  const pastStatsRes = await db.query(
    `SELECT 
       COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) AS completed_count,
       COUNT(CASE WHEN status = 'NO_SHOW' THEN 1 END) AS noshow_count
     FROM reservations
     WHERE user_id = $1`,
    [userId]
  );

  const completed = parseInt(pastStatsRes.rows[0]?.completed_count || '0', 10);
  const noshows = parseInt(pastStatsRes.rows[0]?.noshow_count || '0', 10);
  let reliabilityScore = 0.95; // Default for new users
  if (completed + noshows > 0) {
    reliabilityScore = Math.max(0.4, Math.round((completed / (completed + noshows * 2)) * 100) / 100);
  }

  const now = new Date();
  const calc = calculatePriorityScore(stateOfChargePercent, now, reliabilityScore, now);

  const insertRes = await db.query(
    `INSERT INTO waiting_list_entries (
       user_id, charging_point_id, requested_start_time, requested_end_time,
       state_of_charge_percent, waiting_since, reliability_score, priority_score, status
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'QUEUED')
     RETURNING *`,
    [
      userId,
      chargingPointId,
      start.toISOString(),
      end.toISOString(),
      stateOfChargePercent,
      now.toISOString(),
      reliabilityScore,
      calc.priorityScore,
    ]
  );

  const entry = insertRes.rows[0];

  // In-app notification
  await db.query(
    `INSERT INTO notifications (user_id, title, message, type)
     VALUES ($1, 'Joined Waiting List', $2, 'INFO')`,
    [
      userId,
      `You joined the smart waiting list for ${cpRes.rows[0].station_name} (${cpRes.rows[0].point_code}). Initial Priority Score: ${calc.priorityScore}.`,
    ]
  );

  res.status(201).json({
    success: true,
    data: {
      entry: {
        ...entry,
        stationName: cpRes.rows[0].station_name,
        pointCode: cpRes.rows[0].point_code,
        priorityBreakdown: calc,
      },
    },
  });
}

export async function getWaitingList(req: Request, res: Response): Promise<void> {
  const { chargingPointId, all } = req.query as { chargingPointId?: string; all?: string };
  const userId = req.user!.id;
  const userRole = req.user!.role;

  let sql = `
    SELECT 
      w.id,
      w.user_id,
      u.full_name AS user_name,
      u.email AS user_email,
      w.charging_point_id,
      cp.point_code,
      cp.connector_type,
      cp.power_kw,
      s.id AS station_id,
      s.name AS station_name,
      w.requested_start_time,
      w.requested_end_time,
      w.state_of_charge_percent,
      w.waiting_since,
      w.reliability_score,
      w.priority_score,
      w.status,
      w.allocated_reservation_id,
      w.created_at
    FROM waiting_list_entries w
    JOIN users u ON w.user_id = u.id
    JOIN charging_points cp ON w.charging_point_id = cp.id
    JOIN charging_stations s ON cp.station_id = s.id
    WHERE 1=1
  `;
  const params: any[] = [];
  let paramIdx = 1;

  if (chargingPointId) {
    sql += ` AND w.charging_point_id = $${paramIdx}`;
    params.push(parseInt(chargingPointId, 10));
    paramIdx++;
  }

  // If not admin and not explicitly requesting all, filter by user unless viewing public queue
  if (userRole !== 'ADMIN' && all !== 'true') {
    sql += ` AND (w.user_id = $${paramIdx} OR w.status = 'QUEUED')`;
    params.push(userId);
    paramIdx++;
  }

  sql += ` ORDER BY w.status = 'QUEUED' DESC, w.priority_score DESC, w.waiting_since ASC`;

  const result = await db.query(sql, params);
  const now = new Date();

  // Dynamically compute real-time priority scores based on current elapsed waiting time
  const entries = result.rows.map((row) => {
    const soc = parseFloat(row.state_of_charge_percent);
    const rel = parseFloat(row.reliability_score);
    const waitDate = new Date(row.waiting_since);
    const breakdown = calculatePriorityScore(soc, waitDate, rel, now);

    return {
      id: row.id,
      userId: row.user_id,
      userName: row.user_name,
      userEmail: row.user_email,
      chargingPointId: row.charging_point_id,
      pointCode: row.point_code,
      connectorType: row.connector_type,
      powerKw: parseFloat(row.power_kw),
      stationId: row.station_id,
      stationName: row.station_name,
      requestedStartTime: row.requested_start_time,
      requestedEndTime: row.requested_end_time,
      stateOfChargePercent: soc,
      waitingSince: row.waiting_since,
      reliabilityScore: rel,
      priorityScore: row.status === 'QUEUED' ? breakdown.priorityScore : parseFloat(row.priority_score),
      status: row.status,
      allocatedReservationId: row.allocated_reservation_id,
      createdAt: row.created_at,
      priorityBreakdown: breakdown,
    };
  });

  // Re-sort queued entries by refreshed priority score
  entries.sort((a, b) => {
    if (a.status === 'QUEUED' && b.status === 'QUEUED') {
      return b.priorityScore - a.priorityScore;
    }
    return 0;
  });

  res.json({
    success: true,
    data: {
      entries,
      methodology: {
        formula: 'P_i = 0.50 * U_i + 0.30 * T_i + 0.20 * R_i',
        weights: { alpha: 0.50, beta: 0.30, gamma: 0.20 },
        explanation: 'Urgency (1 - SOC/100) has 50% weight, elapsed waiting time has 30% weight, and historical reliability score has 20% weight.',
      },
    },
  });
}

export async function cancelWaitingListEntry(req: Request, res: Response): Promise<void> {
  const entryId = parseInt(req.params.id, 10);
  const userId = req.user!.id;
  const userRole = req.user!.role;

  const entryRes = await db.query(
    'SELECT id, user_id, status FROM waiting_list_entries WHERE id = $1',
    [entryId]
  );

  if (entryRes.rowCount === 0) {
    res.status(404).json({ success: false, error: { message: 'Waiting list entry not found.' } });
    return;
  }

  const entry = entryRes.rows[0];

  if (userRole !== 'ADMIN' && entry.user_id !== userId) {
    res.status(403).json({ success: false, error: { message: 'Unauthorized to cancel this waiting list entry.' } });
    return;
  }

  await db.query(
    "UPDATE waiting_list_entries SET status = 'CANCELLED', updated_at = CURRENT_TIMESTAMP WHERE id = $1",
    [entryId]
  );

  res.json({ success: true, message: 'Waiting list entry cancelled.' });
}

export async function simulateSlotAllocation(req: Request, res: Response): Promise<void> {
  const { chargingPointId, startTime, endTime } = req.body;

  if (!chargingPointId) {
    res.status(400).json({ success: false, error: { message: 'chargingPointId is required.' } });
    return;
  }

  const start = startTime ? new Date(startTime) : new Date();
  const end = endTime ? new Date(endTime) : new Date(Date.now() + 60 * 60 * 1000);

  const result = await allocateReleasedSlot(chargingPointId, start, end);

  res.json({
    success: true,
    data: result,
  });
}

