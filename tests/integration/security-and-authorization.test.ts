import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../../server/src/app.js';
import { db } from '../../server/src/database/db.js';

describe('Security, RBAC, and BOLA/IDOR Prevention Tests', () => {
  let user1Token: string;
  let user2Token: string;
  let adminToken: string;
  let user1ReservationId: number;

  beforeAll(async () => {
    await db.init();

    // Log in Rahul (USER)
    const login1 = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'rahul.sharma@example.com', password: 'User@12345' });
    user1Token = login1.body.data.token;

    // Log in Priya (USER)
    const login2 = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'priya.verma@example.com', password: 'User@12345' });
    user2Token = login2.body.data.token;

    // Log in Dr. Sharma (ADMIN)
    const loginAdmin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@iilm.edu', password: 'Admin@12345' });
    adminToken = loginAdmin.body.data.token;

    // Fetch a reservation belonging to User 1 (Rahul)
    const resvRes = await db.query(
      "SELECT id FROM reservations WHERE user_id = (SELECT id FROM users WHERE email = 'rahul.sharma@example.com') LIMIT 1"
    );
    user1ReservationId = resvRes.rows[0].id;
  });

  it('should prevent an unauthenticated user from accessing private reservations', async () => {
    const res = await request(app).get(`/api/v1/reservations/${user1ReservationId}`);
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should allow the owner (User 1) to access their own reservation details', async () => {
    const res = await request(app)
      .get(`/api/v1/reservations/${user1ReservationId}`)
      .set('Authorization', `Bearer ${user1Token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.reservation.id).toBe(user1ReservationId);
  });

  it('should prevent User 2 from accessing User 1 reservation details (BOLA/IDOR protection)', async () => {
    const res = await request(app)
      .get(`/api/v1/reservations/${user1ReservationId}`)
      .set('Authorization', `Bearer ${user2Token}`);
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toContain('Unauthorized');
  });

  it('should prevent User 2 from cancelling User 1 reservation (BOLA/IDOR protection)', async () => {
    const res = await request(app)
      .post(`/api/v1/reservations/${user1ReservationId}/cancel`)
      .set('Authorization', `Bearer ${user2Token}`)
      .send({ reason: 'Malicious attempt' });
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toContain('Unauthorized');
  });

  it('should prevent a normal USER from accessing the administrator dashboard', async () => {
    const res = await request(app)
      .get('/api/v1/admin/dashboard')
      .set('Authorization', `Bearer ${user1Token}`);
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toContain('Access denied');
  });

  it('should allow an authorized ADMIN to access the administrator dashboard', async () => {
    const res = await request(app)
      .get('/api/v1/admin/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.metrics).toBeDefined();
    expect(res.body.data.metrics.totalStations).toBeGreaterThan(0);
  });
});
