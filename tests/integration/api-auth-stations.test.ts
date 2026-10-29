import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../../server/src/app.js';
import { db } from '../../server/src/database/db.js';

describe('EV Charging API Integration Tests', () => {
  beforeAll(async () => {
    await db.init();
  });

  it('GET /api/health should return system status and project metadata', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('UP');
    expect(res.body.database).toBe('CONNECTED');
    expect(res.body.institution).toContain('IILM University');
  });

  it('GET /api/project-info should return academic project details', async () => {
    const res = await request(app).get('/api/project-info');
    expect(res.status).toBe(200);
    expect(res.body.degree).toBe('B.Tech CSE');
    expect(res.body.waitingListAlgorithm).toContain('P_i = 0.50 * U_i');
  });

  it('POST /api/v1/auth/login should authenticate valid user credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'rahul.sharma@example.com',
        password: 'User@12345',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe('rahul.sharma@example.com');
  });

  it('POST /api/v1/auth/login should reject invalid credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'rahul.sharma@example.com',
        password: 'WrongPassword999!',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/v1/stations should return list of charging stations in Greater Noida', async () => {
    const res = await request(app).get('/api/v1/stations');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.stations)).toBe(true);
    expect(res.body.data.stations.length).toBeGreaterThan(0);
  });
});

