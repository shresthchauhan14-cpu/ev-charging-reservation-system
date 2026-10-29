import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../database/db.js';

export interface AuthUser {
  id: number;
  email: string;
  fullName: string;
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'iilm_ev_charging_system_jwt_secret_dev_2026_key!';

export function signToken(user: AuthUser): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any }
  );
}

export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    let token: string | undefined;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      res.status(401).json({ success: false, error: { message: 'Authentication required. No token provided.' } });
      return;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Verify user still exists in database and is active
    const userResult = await db.query(
      'SELECT id, email, full_name, role, account_status FROM users WHERE id = $1',
      [decoded.id]
    );

    if (userResult.rowCount === 0) {
      res.status(401).json({ success: false, error: { message: 'User account not found.' } });
      return;
    }

    const user = userResult.rows[0];
    if (user.account_status !== 'ACTIVE') {
      res.status(403).json({ success: false, error: { message: 'User account is suspended or inactive.' } });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
    };

    next();
  } catch (err: any) {
    res.status(401).json({ success: false, error: { message: 'Invalid or expired authentication token.' } });
  }
}

export function requireRole(...allowedRoles: Array<'USER' | 'ADMIN' | 'SUPER_ADMIN'>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: { message: 'Authentication required.' } });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: { message: `Access denied. Requires one of roles: ${allowedRoles.join(', ')}` },
      });
      return;
    }

    next();
  };
}
