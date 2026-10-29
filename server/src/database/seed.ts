import bcrypt from 'bcryptjs';
import { db } from './db.js';

export async function runSeeds(): Promise<void> {
  console.log('[Seed] Seeding development database...');
  await db.init();

  const salt = await bcrypt.genSalt(10);
  const adminPassHash = await bcrypt.hash('Admin@12345', salt);
  const userPassHash = await bcrypt.hash('User@12345', salt);

  // 1. Seed Users
  console.log('[Seed] Seeding Users...');
  const users = [
    {
      name: 'Dr. A. Sharma (IILM Admin)',
      email: 'admin@iilm.edu',
      phone: '+91 98765 43210',
      role: 'ADMIN',
      pass: adminPassHash,
    },
    {
      name: 'Rahul Sharma',
      email: 'rahul.sharma@example.com',
      phone: '+91 98111 22334',
      role: 'USER',
      pass: userPassHash,
    },
    {
      name: 'Priya Verma',
      email: 'priya.verma@example.com',
      phone: '+91 98222 33445',
      role: 'USER',
      pass: userPassHash,
    },
    {
      name: 'Amit Singh',
      email: 'amit.singh@example.com',
      phone: '+91 98333 44556',
      role: 'USER',
      pass: userPassHash,
    },
    {
      name: 'Sneha Patel',
      email: 'sneha.patel@example.com',
      phone: '+91 98444 55667',
      role: 'USER',
      pass: userPassHash,
    },
  ];

  for (const u of users) {
    await db.query(
      `INSERT INTO users (full_name, email, password_hash, phone, role)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO NOTHING`,
      [u.name, u.email, u.pass, u.phone, u.role]
    );
  }

  // 2. Seed Vehicles
  console.log('[Seed] Seeding Vehicles...');
  const userRows = await db.query('SELECT id, email FROM users');
  const userMap = new Map(userRows.rows.map((r: any) => [r.email, r.id]));

  const vehicles = [
    {
      email: 'rahul.sharma@example.com',
      name: 'Tata Nexon EV Max',
      reg: 'UP-16-EV-2024',
      battery: 40.5,
    },
    {
      email: 'priya.verma@example.com',
      name: 'MG ZS EV Excite',
      reg: 'UP-16-EV-5542',
      battery: 50.3,
    },
    {
      email: 'amit.singh@example.com',
      name: 'Hyundai Ioniq 5',
      reg: 'DL-1C-EV-9901',
      battery: 72.6,
    },
    {
      email: 'sneha.patel@example.com',
      name: 'Mahindra XUV400 EV',
      reg: 'HR-26-EV-1020',
      battery: 39.4,
    },
  ];

  for (const v of vehicles) {
    const userId = userMap.get(v.email);
    if (userId) {
      await db.query(
        `INSERT INTO vehicles (user_id, vehicle_name, registration_number, battery_capacity_kwh)
         VALUES ($1, $2, $3, $4)`,
        [userId, v.name, v.reg, v.battery]
      );
    }
  }

  // 3. Seed Stations
  console.log('[Seed] Seeding Charging Stations in Greater Noida...');
  const stations = [
    {
      name: 'Greater Noida EV Hub (Knowledge Park III)',
      desc: 'High-speed flagship EV charging hub located near academic institutions with lounge and cafeteria.',
      address: 'Plot No. 16, Knowledge Park III, Greater Noida',
      city: 'Greater Noida',
      lat: 28.4612,
      lon: 77.4988,
      status: 'OPERATIONAL',
      open: '06:00:00',
      close: '23:00:00',
    },
    {
      name: 'Pari Chowk Fast-Charge Metro Station',
      desc: '24/7 high-traffic rapid charging terminal integrated with Pari Chowk multimodal transit hub.',
      address: 'Metro Station Concourse, Pari Chowk, Greater Noida',
      city: 'Greater Noida',
      lat: 28.4652,
      lon: 77.5108,
      status: 'OPERATIONAL',
      open: '00:00:00',
      close: '23:59:59',
    },
    {
      name: 'Sector Alpha-1 Commercial EcoHub',
      desc: 'Convenient commercial center charging station equipped with multi-standard AC and DC chargers.',
      address: 'Commercial Complex, Sector Alpha-1, Greater Noida',
      city: 'Greater Noida',
      lat: 28.4821,
      lon: 77.5142,
      status: 'OPERATIONAL',
      open: '07:00:00',
      close: '22:00:00',
    },
    {
      name: 'Expwy Plaza Supercharger (Yamuna Expressway)',
      desc: 'Ultra-fast highway corridor station featuring high-power liquid-cooled CCS2 charging dispensers.',
      address: 'Expressway Interchange, Sector 150 / Expressway Plaza, Greater Noida',
      city: 'Greater Noida',
      lat: 28.4419,
      lon: 77.4812,
      status: 'OPERATIONAL',
      open: '00:00:00',
      close: '23:59:59',
    },
  ];

  for (const s of stations) {
    await db.query(
      `INSERT INTO charging_stations (name, description, address, city, latitude, longitude, operating_status, opening_time, closing_time)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [s.name, s.desc, s.address, s.city, s.lat, s.lon, s.status, s.open, s.close]
    );
  }

  // 4. Seed Charging Points
  console.log('[Seed] Seeding Charging Points...');
  const stationRows = await db.query('SELECT id, name FROM charging_stations ORDER BY id');
  const s1 = stationRows.rows[0]?.id;
  const s2 = stationRows.rows[1]?.id;
  const s3 = stationRows.rows[2]?.id;
  const s4 = stationRows.rows[3]?.id;

  const points = [
    // Station 1: Knowledge Park
    { sId: s1, code: 'KP3-DC-01', type: 'CCS2', power: 60, price: 16.50, status: 'AVAILABLE' },
    { sId: s1, code: 'KP3-DC-02', type: 'CCS2', power: 60, price: 16.50, status: 'OCCUPIED' },
    { sId: s1, code: 'KP3-AC-03', type: 'TYPE2', power: 22, price: 13.00, status: 'AVAILABLE' },
    { sId: s1, code: 'KP3-GB-04', type: 'GBT', power: 50, price: 15.00, status: 'AVAILABLE' },

    // Station 2: Pari Chowk
    { sId: s2, code: 'PC-UFC-01', type: 'CCS2', power: 120, price: 18.50, status: 'AVAILABLE' },
    { sId: s2, code: 'PC-UFC-02', type: 'CCS2', power: 120, price: 18.50, status: 'RESERVED' },
    { sId: s2, code: 'PC-DC-03', type: 'CCS2', power: 60, price: 16.50, status: 'AVAILABLE' },
    { sId: s2, code: 'PC-AC-04', type: 'TYPE2', power: 22, price: 13.00, status: 'AVAILABLE' },

    // Station 3: Alpha-1
    { sId: s3, code: 'ALP-DC-01', type: 'CCS2', power: 60, price: 16.00, status: 'AVAILABLE' },
    { sId: s3, code: 'ALP-AC-02', type: 'TYPE2', power: 22, price: 12.50, status: 'AVAILABLE' },
    { sId: s3, code: 'ALP-GB-03', type: 'GBT', power: 50, price: 14.50, status: 'OUT_OF_SERVICE' },

    // Station 4: Expressway Supercharger
    { sId: s4, code: 'EXP-HP-01', type: 'CCS2', power: 150, price: 19.50, status: 'AVAILABLE' },
    { sId: s4, code: 'EXP-HP-02', type: 'CCS2', power: 150, price: 19.50, status: 'OCCUPIED' },
  ];

  for (const p of points) {
    if (p.sId) {
      await db.query(
        `INSERT INTO charging_points (station_id, point_code, connector_type, power_kw, price_per_kwh, operational_status)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (station_id, point_code) DO NOTHING`,
        [p.sId, p.code, p.type, p.power, p.price, p.status]
      );
    }
  }

  // 5. Seed Reservations
  console.log('[Seed] Seeding Reservations...');
  const pointRows = await db.query('SELECT id, point_code, price_per_kwh FROM charging_points');
  const pointMap = new Map(pointRows.rows.map((r: any) => [r.point_code, r.id]));

  const now = new Date();
  const today14 = new Date(now);
  today14.setHours(14, 0, 0, 0);
  const today15 = new Date(now);
  today15.setHours(15, 0, 0, 0);

  const today16 = new Date(now);
  today16.setHours(16, 0, 0, 0);
  const today17 = new Date(now);
  today17.setHours(17, 0, 0, 0);

  const yesterday10 = new Date(now);
  yesterday10.setDate(yesterday10.getDate() - 1);
  yesterday10.setHours(10, 0, 0, 0);
  const yesterday11 = new Date(now);
  yesterday11.setDate(yesterday11.getDate() - 1);
  yesterday11.setHours(11, 0, 0, 0);

  const reservations = [
    {
      ref: 'EV-IILM-2026-101',
      userEmail: 'rahul.sharma@example.com',
      pointCode: 'KP3-DC-02',
      start: today14.toISOString(),
      end: today15.toISOString(),
      status: 'CONFIRMED',
      energy: 35.0,
      cost: 577.50,
    },
    {
      ref: 'EV-IILM-2026-102',
      userEmail: 'priya.verma@example.com',
      pointCode: 'PC-UFC-02',
      start: today16.toISOString(),
      end: today17.toISOString(),
      status: 'CONFIRMED',
      energy: 45.0,
      cost: 832.50,
    },
    {
      ref: 'EV-IILM-2026-098',
      userEmail: 'rahul.sharma@example.com',
      pointCode: 'KP3-DC-01',
      start: yesterday10.toISOString(),
      end: yesterday11.toISOString(),
      status: 'COMPLETED',
      energy: 32.5,
      cost: 536.25,
    },
    {
      ref: 'EV-IILM-2026-095',
      userEmail: 'amit.singh@example.com',
      pointCode: 'PC-UFC-01',
      start: yesterday10.toISOString(),
      end: yesterday11.toISOString(),
      status: 'CANCELLED',
      energy: 0,
      cost: 0,
      reason: 'Driver changed travel schedule',
    },
  ];

  for (const r of reservations) {
    const userId = userMap.get(r.userEmail);
    const pointId = pointMap.get(r.pointCode);
    if (userId && pointId) {
      await db.query(
        `INSERT INTO reservations (booking_reference, user_id, charging_point_id, start_time, end_time, status, cancellation_reason, estimated_energy_kwh, estimated_cost)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (booking_reference) DO NOTHING`,
        [r.ref, userId, pointId, r.start, r.end, r.status, r.reason || null, r.energy, r.cost]
      );
    }
  }

  // 6. Seed Waiting List Entries
  console.log('[Seed] Seeding Waiting List Entries for Intelligent Reallocation...');
  const targetPointId = pointMap.get('KP3-DC-02');
  if (targetPointId) {
    const wait1Time = new Date(Date.now() - 45 * 60 * 1000); // 45 mins ago
    const wait2Time = new Date(Date.now() - 25 * 60 * 1000); // 25 mins ago
    const wait3Time = new Date(Date.now() - 50 * 60 * 1000); // 50 mins ago

    // P = 0.50*(1 - SOC/100) + 0.30*(t_wait/60) + 0.20*(R)
    // Amit: SOC 15%, wait 45m, R 0.95 -> 0.50*(0.85) + 0.30*(0.75) + 0.20*(0.95) = 0.425 + 0.225 + 0.190 = 0.840
    // Priya: SOC 35%, wait 25m, R 0.90 -> 0.50*(0.65) + 0.30*(0.417) + 0.20*(0.90) = 0.325 + 0.125 + 0.180 = 0.630
    // Sneha: SOC 60%, wait 50m, R 0.85 -> 0.50*(0.40) + 0.30*(0.833) + 0.20*(0.85) = 0.200 + 0.250 + 0.170 = 0.620
    const waitlist = [
      {
        email: 'amit.singh@example.com',
        pointId: targetPointId,
        start: today14.toISOString(),
        end: today15.toISOString(),
        soc: 15.0,
        since: wait1Time.toISOString(),
        r: 0.950,
        p: 0.8400,
      },
      {
        email: 'priya.verma@example.com',
        pointId: targetPointId,
        start: today14.toISOString(),
        end: today15.toISOString(),
        soc: 35.0,
        since: wait2Time.toISOString(),
        r: 0.900,
        p: 0.6300,
      },
      {
        email: 'sneha.patel@example.com',
        pointId: targetPointId,
        start: today14.toISOString(),
        end: today15.toISOString(),
        soc: 60.0,
        since: wait3Time.toISOString(),
        r: 0.850,
        p: 0.6200,
      },
    ];

    for (const w of waitlist) {
      const uId = userMap.get(w.email);
      if (uId) {
        await db.query(
          `INSERT INTO waiting_list_entries (user_id, charging_point_id, requested_start_time, requested_end_time, state_of_charge_percent, waiting_since, reliability_score, priority_score, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'QUEUED')`,
          [uId, w.pointId, w.start, w.end, w.soc, w.since, w.r, w.p]
        );
      }
    }
  }

  // 7. Seed Notifications & Audit Logs
  const adminId = userMap.get('admin@iilm.edu');
  const rahulId = userMap.get('rahul.sharma@example.com');

  if (rahulId) {
    await db.query(
      `INSERT INTO notifications (user_id, title, message, type)
       VALUES ($1, 'Reservation Confirmed', 'Your reservation EV-IILM-2026-101 at Greater Noida EV Hub is confirmed for 14:00.', 'SUCCESS')`,
      [rahulId]
    );
  }

  if (adminId) {
    await db.query(
      `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, details)
       VALUES ($1, 'SYSTEM_BOOTSTRAP', 'SYSTEM', '1', 'Initial database schema and Greater Noida demonstration seed loaded.')`,
      [adminId]
    );
  }

  console.log('[Seed] Database seeded successfully with realistic demonstration records.');
}

// If run directly via CLI
if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js')) {
  runSeeds()
    .then(() => {
      console.log('[Seed] Completed.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[Seed] Failed:', err);
      process.exit(1);
    });
}

