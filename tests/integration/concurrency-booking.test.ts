import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../server/src/app.js';
import { db } from '../../server/src/database/db.js';

describe('Critical Booking Concurrency & Overlap Prevention Test', () => {
  let user1Token: string;
  let user2Token: string;
  let testPointId: number;

  beforeAll(async () => {
    await db.init();

    // Authenticate user 1 (Rahul)
    const login1 = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'rahul.sharma@example.com', password: 'User@12345' });
    user1Token = login1.body.data.token;

    // Authenticate user 2 (Priya)
    const login2 = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'priya.verma@example.com', password: 'User@12345' });
    user2Token = login2.body.data.token;

    // Pick an available charging point (CP-101)
    const pointRes = await db.query(
      "SELECT id FROM charging_points WHERE point_code = 'KP3-DC-01' LIMIT 1"
    );
    testPointId = pointRes.rows[0].id;
  });

  beforeEach(async () => {
    // Clean up future test reservations to ensure repeatable idempotent test execution
    await db.query(
      "DELETE FROM reservations WHERE charging_point_id = $1 AND start_time > CURRENT_TIMESTAMP + INTERVAL '1 day'",
      [testPointId]
    );
  });

  it('should prevent overlapping reservations for the same charging point under concurrent requests', async () => {
    // Generate a unique future time interval to test: 3 days from now
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 3);
    futureDate.setHours(11, 0, 0, 0);

    const startTime = new Date(futureDate).toISOString();
    const endTime = new Date(futureDate.getTime() + 60 * 60 * 1000).toISOString(); // 1 hour later

    // Fire two simultaneous conflicting booking attempts for the exact same point and window
    const [res1, res2] = await Promise.all([
      request(app)
        .post('/api/v1/reservations')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          chargingPointId: testPointId,
          startTime,
          endTime,
        }),
      request(app)
        .post('/api/v1/reservations')
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          chargingPointId: testPointId,
          startTime,
          endTime,
        }),
    ]);

    const statuses = [res1.status, res2.status].sort();
    console.log(`[Concurrency Test Result] Request 1: ${res1.status}, Request 2: ${res2.status}`);

    // Exactly one must succeed (201) and one must be rejected with Conflict (409)
    expect(statuses).toEqual([201, 409]);

    const conflictResponse = res1.status === 409 ? res1.body : res2.body;
    expect(conflictResponse.success).toBe(false);
    expect(conflictResponse.error.message).toContain('Slot Conflict');
  });

  it('should allow adjacent non-overlapping bookings [start, end) on the same charging point', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 4);
    futureDate.setHours(10, 0, 0, 0);

    const slot1Start = new Date(futureDate).toISOString();
    const slot1End = new Date(futureDate.getTime() + 60 * 60 * 1000).toISOString(); // 10:00 - 11:00

    const slot2Start = slot1End; // 11:00 (exact adjacent boundary)
    const slot2End = new Date(futureDate.getTime() + 120 * 60 * 1000).toISOString(); // 11:00 - 12:00

    const book1 = await request(app)
      .post('/api/v1/reservations')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        chargingPointId: testPointId,
        startTime: slot1Start,
        endTime: slot1End,
      });

    const book2 = await request(app)
      .post('/api/v1/reservations')
      .set('Authorization', `Bearer ${user2Token}`)
      .send({
        chargingPointId: testPointId,
        startTime: slot2Start,
        endTime: slot2End,
      });

    expect(book1.status).toBe(201);
    expect(book2.status).toBe(201);
    expect(book1.body.success).toBe(true);
    expect(book2.body.success).toBe(true);
  });
});
