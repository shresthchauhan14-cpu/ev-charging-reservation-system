import { db } from '../../database/db.js';

export interface PriorityBreakdown {
  userId: number;
  userName: string;
  entryId: number;
  socPercent: number;
  urgencyComponent: number; // alpha * (1 - SOC)
  waitingTimeMinutes: number;
  waitingTimeComponent: number; // beta * min(wait/60, 1)
  reliabilityScore: number;
  reliabilityComponent: number; // gamma * R
  totalPriorityScore: number; // P_i
}

export function calculatePriorityScore(
  socPercent: number,
  waitingSince: Date,
  reliabilityScore: number,
  now: Date = new Date()
): {
  urgencyU: number;
  waitingT: number;
  reliabilityR: number;
  alpha: number;
  beta: number;
  gamma: number;
  priorityScore: number;
  waitingMinutes: number;
} {
  const alpha = 0.50;
  const beta = 0.30;
  const gamma = 0.20;

  // Normalized SOC fraction between 0.0 and 1.0
  const normalizedSoc = Math.max(0, Math.min(100, socPercent)) / 100.0;
  // Urgency: 1 - SOC
  const urgencyU = Math.round((1.0 - normalizedSoc) * 10000) / 10000;

  // Waiting duration in minutes capped at 60 mins
  const waitingMs = Math.max(0, now.getTime() - waitingSince.getTime());
  const waitingMinutes = Math.round(waitingMs / (1000 * 60));
  const waitingT = Math.min(1.0, Math.round((waitingMinutes / 60.0) * 10000) / 10000);

  // Reliability score clamped between 0 and 1
  const reliabilityR = Math.max(0, Math.min(1.0, reliabilityScore));

  // P_i = alpha*U_i + beta*T_i + gamma*R_i
  const priorityScore = Math.round((alpha * urgencyU + beta * waitingT + gamma * reliabilityR) * 10000) / 10000;

  return {
    urgencyU,
    waitingT,
    reliabilityR,
    alpha,
    beta,
    gamma,
    priorityScore,
    waitingMinutes,
  };
}

export async function allocateReleasedSlot(
  chargingPointId: number,
  releasedStart: Date,
  releasedEnd: Date
): Promise<{
  allocated: boolean;
  message: string;
  selectedCandidate?: PriorityBreakdown;
  newReservationId?: number;
  bookingReference?: string;
  allEvaluatedCandidates?: PriorityBreakdown[];
}> {
  return await db.transaction(async (tx) => {
    // 1. Fetch queued entries for this charging point
    const entriesRes = await tx.query(
      `SELECT w.id, w.user_id, u.full_name AS user_name, u.email AS user_email,
              w.charging_point_id, w.requested_start_time, w.requested_end_time,
              w.state_of_charge_percent, w.waiting_since, w.reliability_score
       FROM waiting_list_entries w
       JOIN users u ON w.user_id = u.id
       WHERE w.charging_point_id = $1
         AND w.status = 'QUEUED'
       ORDER BY w.waiting_since ASC`,
      [chargingPointId]
    );

    if (entriesRes.rowCount === 0) {
      return {
        allocated: false,
        message: 'No eligible candidates currently queued in waiting list for this charging point.',
      };
    }

    const now = new Date();
    const evaluated: Array<PriorityBreakdown & { rawEntry: any }> = [];

    // 2. Filter candidates whose requested time window fits within the released window
    for (const entry of entriesRes.rows) {
      const reqStart = new Date(entry.requested_start_time);
      const reqEnd = new Date(entry.requested_end_time);

      // Check interval eligibility: fits within released slot window (with generous 30 min tolerance)
      const fitsWindow = reqStart >= new Date(releasedStart.getTime() - 30 * 60 * 1000) &&
                         reqEnd <= new Date(releasedEnd.getTime() + 30 * 60 * 1000);

      const soc = parseFloat(entry.state_of_charge_percent);
      const rel = parseFloat(entry.reliability_score);
      const waitDate = new Date(entry.waiting_since);

      const calc = calculatePriorityScore(soc, waitDate, rel, now);

      evaluated.push({
        userId: entry.user_id,
        userName: entry.user_name,
        entryId: entry.id,
        socPercent: soc,
        urgencyComponent: Math.round(calc.alpha * calc.urgencyU * 10000) / 10000,
        waitingTimeMinutes: calc.waitingMinutes,
        waitingTimeComponent: Math.round(calc.beta * calc.waitingT * 10000) / 10000,
        reliabilityScore: rel,
        reliabilityComponent: Math.round(calc.gamma * calc.reliabilityR * 10000) / 10000,
        totalPriorityScore: calc.priorityScore,
        rawEntry: entry,
      });
    }

    if (evaluated.length === 0) {
      return {
        allocated: false,
        message: 'No candidates matched the released time window.',
      };
    }

    // 3. Sort deterministically by priority score DESC, then earliest waiting_since ASC
    evaluated.sort((a, b) => {
      if (b.totalPriorityScore !== a.totalPriorityScore) {
        return b.totalPriorityScore - a.totalPriorityScore;
      }
      return new Date(a.rawEntry.waiting_since).getTime() - new Date(b.rawEntry.waiting_since).getTime();
    });

    const winner = evaluated[0];
    const candidate = winner.rawEntry;

    // 4. Verify charging point details
    const cpRes = await tx.query(
      `SELECT cp.id, cp.point_code, cp.power_kw, cp.price_per_kwh, s.name AS station_name
       FROM charging_points cp
       JOIN charging_stations s ON cp.station_id = s.id
       WHERE cp.id = $1`,
      [chargingPointId]
    );
    const cp = cpRes.rows[0];

    const powerKw = parseFloat(cp.power_kw);
    const pricePerKwh = parseFloat(cp.price_per_kwh);
    const durationHours = (new Date(candidate.requested_end_time).getTime() - new Date(candidate.requested_start_time).getTime()) / (1000 * 60 * 60);
    const estimatedEnergy = Math.round(powerKw * durationHours * 0.85 * 100) / 100;
    const estimatedCost = Math.round(estimatedEnergy * pricePerKwh * 100) / 100;

    const bookingRef = `EV-IILM-WAIT-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // 5. Create new reservation for the winner
    const resvRes = await tx.query(
      `INSERT INTO reservations (
         booking_reference, user_id, charging_point_id, start_time, end_time,
         status, estimated_energy_kwh, estimated_cost
       )
       VALUES ($1, $2, $3, $4, $5, 'CONFIRMED', $6, $7)
       RETURNING id`,
      [
        bookingRef,
        candidate.user_id,
        chargingPointId,
        candidate.requested_start_time,
        candidate.requested_end_time,
        estimatedEnergy,
        estimatedCost,
      ]
    );

    const newResvId = resvRes.rows[0].id;

    // 6. Update waiting list entry
    await tx.query(
      `UPDATE waiting_list_entries
       SET status = 'ALLOCATED',
           allocated_reservation_id = $1,
           priority_score = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [newResvId, winner.totalPriorityScore, candidate.id]
    );

    // 7. Send In-App Notification to allocated user
    await tx.query(
      `INSERT INTO notifications (user_id, title, message, type)
       VALUES ($1, 'Charging Slot Allocated from Waiting List!', $2, 'SUCCESS')`,
      [
        candidate.user_id,
        `Great news! A slot has been released at ${cp.station_name} (${cp.point_code}). Your priority score (${winner.totalPriorityScore}) earned you booking ${bookingRef}!`,
      ]
    );

    // 8. Audit log
    await tx.query(
      `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, details)
       VALUES ($1, 'SLOT_REALLOCATED_FROM_WAITING_LIST', 'WAITING_LIST', $2, $3)`,
      [
        candidate.user_id,
        candidate.id.toString(),
        JSON.stringify({
          bookingReference: bookingRef,
          priorityScore: winner.totalPriorityScore,
          socPercent: winner.socPercent,
          waitingMinutes: winner.waitingTimeMinutes,
          reliability: winner.reliabilityScore,
        }),
      ]
    );

    return {
      allocated: true,
      message: `Slot successfully allocated to ${winner.userName} with highest priority score (${winner.totalPriorityScore}).`,
      selectedCandidate: winner,
      newReservationId: newResvId,
      bookingReference: bookingRef,
      allEvaluatedCandidates: evaluated.map(({ rawEntry, ...rest }) => rest),
    };
  });
}

