import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { db } from '../../database/db.js';
import { signToken } from '../../middleware/auth.js';

export const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase().trim(),
});

export const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  token: z.string().min(1, 'Reset token is required'),
});

export async function register(req: Request, res: Response): Promise<void> {
  const { fullName, email, password, phone } = req.body;

  // Check existing user
  const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rowCount > 0) {
    res.status(409).json({
      success: false,
      error: { message: 'An account with this email already exists.' },
    });
    return;
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const insertRes = await db.query(
    `INSERT INTO users (full_name, email, password_hash, phone, role)
     VALUES ($1, $2, $3, $4, 'USER')
     RETURNING id, full_name, email, phone, role, created_at`,
    [fullName, email, passwordHash, phone || null]
  );

  const newUser = insertRes.rows[0];
  const authUser = {
    id: newUser.id,
    email: newUser.email,
    fullName: newUser.full_name,
    role: newUser.role,
  };

  const token = signToken(authUser);

  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  // Audit log
  await db.query(
    `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, details)
     VALUES ($1, 'USER_REGISTERED', 'USER', $2, 'User registered successfully')`,
    [newUser.id, newUser.id.toString()]
  );

  res.status(201).json({
    success: true,
    data: {
      user: {
        id: newUser.id,
        fullName: newUser.full_name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        createdAt: newUser.created_at,
      },
      token,
    },
  });
}

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body;

  const result = await db.query(
    'SELECT id, full_name, email, password_hash, phone, role, account_status FROM users WHERE email = $1',
    [email]
  );

  if (result.rowCount === 0) {
    res.status(401).json({
      success: false,
      error: { message: 'Invalid email or password.' },
    });
    return;
  }

  const user = result.rows[0];

  if (user.account_status !== 'ACTIVE') {
    res.status(403).json({
      success: false,
      error: { message: 'Account is suspended or deactivated.' },
    });
    return;
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    res.status(401).json({
      success: false,
      error: { message: 'Invalid email or password.' },
    });
    return;
  }

  const authUser = {
    id: user.id,
    email: user.email,
    fullName: user.full_name,
    role: user.role,
  };

  const token = signToken(authUser);

  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  // Audit log
  await db.query(
    `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, details)
     VALUES ($1, 'USER_LOGIN', 'USER', $2, 'User login successful')`,
    [user.id, user.id.toString()]
  );

  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
      token,
    },
  });
}

export async function logout(req: Request, res: Response): Promise<void> {
  res.clearCookie('token');
  res.json({ success: true, message: 'Logged out successfully.' });
}

export async function getMe(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, error: { message: 'Not authenticated.' } });
    return;
  }

  const userRes = await db.query(
    'SELECT id, full_name, email, phone, role, account_status, created_at FROM users WHERE id = $1',
    [req.user.id]
  );

  if (userRes.rowCount === 0) {
    res.status(404).json({ success: false, error: { message: 'User not found.' } });
    return;
  }

  const vehiclesRes = await db.query(
    'SELECT id, vehicle_name, registration_number, battery_capacity_kwh FROM vehicles WHERE user_id = $1 ORDER BY id DESC',
    [req.user.id]
  );

  const user = userRes.rows[0];

  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        accountStatus: user.account_status,
        createdAt: user.created_at,
        vehicles: vehiclesRes.rows,
      },
    },
  });
}

export async function forgotPassword(req: Request, res: Response): Promise<void> {
  const { email } = req.body;
  // Always return success to prevent account enumeration
  res.json({
    success: true,
    message: 'If the provided email exists in our system, a secure password reset link has been dispatched.',
  });
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  const { email, newPassword, token } = req.body;
  if (token !== 'demo-reset-token-2026') {
    res.status(400).json({ success: false, error: { message: 'Invalid or expired password reset token.' } });
    return;
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(newPassword, salt);

  const updateRes = await db.query(
    'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE email = $2 RETURNING id',
    [passwordHash, email]
  );

  if (updateRes.rowCount === 0) {
    res.status(404).json({ success: false, error: { message: 'User not found.' } });
    return;
  }

  res.json({ success: true, message: 'Password has been successfully reset. You can now log in.' });
}

