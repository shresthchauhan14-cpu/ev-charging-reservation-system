import { Request, Response } from 'express';
import { db } from '../../database/db.js';

export async function getStations(req: Request, res: Response): Promise<void> {
  const { search, connectorType, city, minPower } = req.query as Record<string, string | undefined>;

  let sql = `
    SELECT 
      s.id,
      s.name,
      s.description,
      s.address,
      s.city,
      s.state,
      s.postal_code,
      s.latitude,
      s.longitude,
      s.operating_status,
      s.opening_time,
      s.closing_time,
      s.created_at,
      COUNT(cp.id) AS total_points,
      COUNT(CASE WHEN cp.operational_status = 'AVAILABLE' THEN 1 END) AS available_points,
      MAX(cp.power_kw) AS max_power_kw,
      MIN(cp.price_per_kwh) AS min_price_per_kwh,
      ARRAY_AGG(DISTINCT cp.connector_type) AS connector_types
    FROM charging_stations s
    LEFT JOIN charging_points cp ON s.id = cp.station_id
    WHERE 1=1
  `;
  const params: any[] = [];
  let paramIdx = 1;

  if (search) {
    sql += ` AND (LOWER(s.name) LIKE $${paramIdx} OR LOWER(s.address) LIKE $${paramIdx} OR LOWER(s.city) LIKE $${paramIdx})`;
    params.push(`%${search.toLowerCase().trim()}%`);
    paramIdx++;
  }

  if (city) {
    sql += ` AND LOWER(s.city) = $${paramIdx}`;
    params.push(city.toLowerCase().trim());
    paramIdx++;
  }

  sql += `
    GROUP BY s.id
  `;

  if (connectorType) {
    sql += ` HAVING $${paramIdx} = ANY(ARRAY_AGG(cp.connector_type))`;
    params.push(connectorType.toUpperCase());
    paramIdx++;
  }

  sql += ` ORDER BY s.id ASC`;

  const result = await db.query(sql, params);

  // Transform rows to friendly types
  const stations = result.rows.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    address: row.address,
    city: row.city,
    state: row.state,
    postalCode: row.postal_code,
    latitude: parseFloat(row.latitude),
    longitude: parseFloat(row.longitude),
    operatingStatus: row.operating_status,
    openingTime: row.opening_time,
    closingTime: row.closing_time,
    totalPoints: parseInt(row.total_points || '0', 10),
    availablePoints: parseInt(row.available_points || '0', 10),
    maxPowerKw: parseFloat(row.max_power_kw || '0'),
    minPricePerKwh: parseFloat(row.min_price_per_kwh || '0'),
    connectorTypes: (row.connector_types || []).filter(Boolean),
  }));

  res.json({ success: true, data: { stations } });
}

export async function getStationById(req: Request, res: Response): Promise<void> {
  const stationId = parseInt(req.params.id, 10);

  const stationRes = await db.query(
    'SELECT * FROM charging_stations WHERE id = $1',
    [stationId]
  );

  if (stationRes.rowCount === 0) {
    res.status(404).json({ success: false, error: { message: 'Charging station not found' } });
    return;
  }

  const station = stationRes.rows[0];

  const pointsRes = await db.query(
    `SELECT id, point_code, connector_type, power_kw, price_per_kwh, operational_status
     FROM charging_points
     WHERE station_id = $1
     ORDER BY point_code ASC`,
    [stationId]
  );

  res.json({
    success: true,
    data: {
      station: {
        id: station.id,
        name: station.name,
        description: station.description,
        address: station.address,
        city: station.city,
        state: station.state,
        postalCode: station.postal_code,
        latitude: parseFloat(station.latitude),
        longitude: parseFloat(station.longitude),
        operatingStatus: station.operating_status,
        openingTime: station.opening_time,
        closingTime: station.closing_time,
        chargingPoints: pointsRes.rows.map((p) => ({
          id: p.id,
          pointCode: p.point_code,
          connectorType: p.connector_type,
          powerKw: parseFloat(p.power_kw),
          pricePerKwh: parseFloat(p.price_per_kwh),
          operationalStatus: p.operational_status,
        })),
      },
    },
  });
}

export async function getStationAvailability(req: Request, res: Response): Promise<void> {
  const stationId = parseInt(req.params.id, 10);
  const { startTime, endTime } = req.query as { startTime?: string; endTime?: string };

  if (!startTime || !endTime) {
    res.status(400).json({
      success: false,
      error: { message: 'Both startTime and endTime (ISO strings) are required.' },
    });
    return;
  }

  const start = new Date(startTime);
  const end = new Date(endTime);

  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
    res.status(400).json({
      success: false,
      error: { message: 'Invalid interval: endTime must be strictly after startTime.' },
    });
    return;
  }

  // Fetch all charging points for this station
  const pointsRes = await db.query(
    `SELECT id, point_code, connector_type, power_kw, price_per_kwh, operational_status
     FROM charging_points
     WHERE station_id = $1
     ORDER BY point_code ASC`,
    [stationId]
  );

  // Fetch all blocking reservations for these charging points during the requested window
  // Standard interval overlap: newStart < existingEnd AND newEnd > existingStart
  const conflictsRes = await db.query(
    `SELECT id, charging_point_id, booking_reference, start_time, end_time, status
     FROM reservations
     WHERE charging_point_id IN (SELECT id FROM charging_points WHERE station_id = $1)
       AND status IN ('CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS')
       AND start_time < $3 AND end_time > $2`,
    [stationId, start.toISOString(), end.toISOString()]
  );

  const bookedPointIds = new Set(conflictsRes.rows.map((r: any) => r.charging_point_id));

  const availability = pointsRes.rows.map((point: any) => {
    const isBooked = bookedPointIds.has(point.id);
    let status = point.operational_status;
    if (point.operational_status === 'OUT_OF_SERVICE') {
      status = 'OUT_OF_SERVICE';
    } else if (isBooked) {
      status = 'OCCUPIED';
    } else {
      status = 'AVAILABLE';
    }

    return {
      chargingPointId: point.id,
      pointCode: point.point_code,
      connectorType: point.connector_type,
      powerKw: parseFloat(point.power_kw),
      pricePerKwh: parseFloat(point.price_per_kwh),
      baseOperationalStatus: point.operational_status,
      intervalStatus: status,
      isAvailableForInterval: status === 'AVAILABLE',
      conflictsCount: conflictsRes.rows.filter((c: any) => c.charging_point_id === point.id).length,
    };
  });

  res.json({
    success: true,
    data: {
      stationId,
      requestedInterval: {
        startTime: start.toISOString(),
        endTime: end.toISOString(),
      },
      chargingPoints: availability,
      totalAvailable: availability.filter((a) => a.isAvailableForInterval).length,
    },
  });
}

