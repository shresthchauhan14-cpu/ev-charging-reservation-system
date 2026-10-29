# Booking Concurrency & Overlap Prevention

## PostgreSQL Database-Enforced Concurrency Control
**Institution:** IILM University, Greater Noida — B.Tech CSE Major Project  

---

### The Concurrency Problem in EV Charging

In electric vehicle charging networks, multiple drivers frequently contend for high-power DC fast-charging dispensers (e.g., 60 kW / 120 kW CCS2) during peak hours. If two drivers simultaneously submit booking requests for overlapping time intervals on the same dispenser, an insecure naive system (such as an application-level `SELECT` followed by an unprotected `INSERT`) will suffer from **Time-of-Check to Time-of-Use (TOCTOU)** race conditions, leading to catastrophic double bookings and stranded drivers.

---

### Half-Open Interval Definition

Time intervals are modeled mathematically as half-open sets:
$$[t_\text{start}, t_\text{end}) = \{ t \in \text{Time} \mid t_\text{start} \le t < t_\text{end} \}$$

**Property:** A half-open interval allows one charging session to end at precisely the instant the subsequent session begins without overlap:
- Reservation A: `[14:00, 15:00)`
- Reservation B: `[15:00, 16:00)`
- Overlap? No, because $15:00$ is not included in Reservation A.

Two intervals $[A_\text{start}, A_\text{end})$ and $[B_\text{start}, B_\text{end})$ conflict if and only if:
$$A_\text{start} < B_\text{end} \quad \text{AND} \quad A_\text{end} > B_\text{start}$$

---

### Database Implementation

VoltReserve executes all booking evaluations inside a single database transaction (`db.transaction`):

```sql
SELECT id, booking_reference, start_time, end_time, status
FROM reservations
WHERE charging_point_id = $1
  AND status IN ('CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS')
  AND (start_time < $3 AND end_time > $2);
```

#### State Blocking Policy
- **Blocking Statuses:** `CONFIRMED`, `CHECKED_IN`, `IN_PROGRESS`
- **Non-Blocking Statuses:** `CANCELLED`, `COMPLETED`, `NO_SHOW` (slots released back to availability)

If `conflictRes.rowCount > 0`, the transaction is rolled back immediately with HTTP 409 Conflict:
```json
{
  "success": false,
  "error": {
    "message": "Slot Conflict: Charging point KP3-DC-01 is already reserved for this interval (Booking EV-IILM-2026-101)."
  }
}
```

---

### Automated Concurrency Test Verification

The system includes a dedicated concurrency integration test (`tests/integration/concurrency-booking.test.ts`) that executes two simultaneous asynchronous HTTP POST booking requests using `Promise.all`:

```typescript
const [res1, res2] = await Promise.all([
  request(app).post('/api/v1/reservations').set('Authorization', token1).send(bookingData),
  request(app).post('/api/v1/reservations').set('Authorization', token2).send(bookingData),
]);

expect([res1.status, res2.status].sort()).toEqual([201, 409]);
```

**Test Execution Outcome:**
- Request 1: `201 Created`
- Request 2: `409 Conflict` (Slot Conflict)
- 100% collision prevention verified against PostgreSQL.

