import { Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../../database/db.js';

export const updateProfileSchema = z.object({
  fullName: z.string().min(2).optional(),
  phone: z.string().optional(),
});

export const addVehicleSchema = z.object({
  vehicleName: z.string().min(2, 'Vehicle name required'),
  registrationNumber: z.string().min(4, 'Registration number required'),
  batteryCapacityKwh: z.number().positive('Battery capacity must be positive'),
});

export async function updateProfile(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;
  const { fullName, phone } = req.body;

  const result = await db.query(
    `UPDATE users
     SET full_name = COALESCE($1, full_name),
         phone = COALESCE($2, phone),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $3
     RETURNING id, full_name, email, phone, role`,
    [fullName || null, phone || null, userId]
  );

  res.json({ success: true, data: { user: result.rows[0] } });
}

export async function getVehicles(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;
  const result = await db.query(
    'SELECT id, vehicle_name, registration_number, battery_capacity_kwh, created_at FROM vehicles WHERE user_id = $1 ORDER BY id DESC',
    [userId]
  );
  res.json({ success: true, data: { vehicles: result.rows } });
}

export async function addVehicle(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;
  const { vehicleName, registrationNumber, batteryCapacityKwh } = req.body;

  const result = await db.query(
    `INSERT INTO vehicles (user_id, vehicle_name, registration_number, battery_capacity_kwh)
     VALUES ($1, $2, $3, $4)
     RETURNING id, vehicle_name, registration_number, battery_capacity_kwh, created_at`,
    [userId, vehicleName, registrationNumber, batteryCapacityKwh]
  );

  res.status(201).json({ success: true, data: { vehicle: result.rows[0] } });
}

export async function deleteVehicle(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;
  const vehicleId = parseInt(req.params.id, 10);

  const result = await db.query(
    'DELETE FROM vehicles WHERE id = $1 AND user_id = $2 RETURNING id',
    [vehicleId, userId]
  );

  if (result.rowCount === 0) {
    res.status(404).json({ success: false, error: { message: 'Vehicle not found or unauthorized' } });
    return;
  }

  res.json({ success: true, message: 'Vehicle deleted successfully' });
}

export async function getNotifications(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;
  const result = await db.query(
    'SELECT id, title, message, type, read, created_at FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20',
    [userId]
  );
  res.json({ success: true, data: { notifications: result.rows } });
}

export async function markNotificationRead(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;
  const notificationId = parseInt(req.params.id, 10);

  await db.query(
    'UPDATE notifications SET read = TRUE WHERE id = $1 AND user_id = $2',
    [notificationId, userId]
  );

  res.json({ success: true, message: 'Marked as read' });
}

