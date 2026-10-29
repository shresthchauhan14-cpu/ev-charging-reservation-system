import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import authRoutes from './modules/auth/auth.routes.js';
import usersRoutes from './modules/users/users.routes.js';
import stationsRoutes from './modules/stations/stations.routes.js';
import reservationsRoutes from './modules/reservations/reservations.routes.js';
import waitingListRoutes from './modules/waiting-list/waiting-list.routes.js';
import adminRoutes from './modules/admin/admin.routes.js';
import { db } from './database/db.js';

dotenv.config();

export const app = express();

// Security Headers
app.use(
  helmet({
    contentSecurityPolicy: false, // Allows flexible dev integration
    crossOriginEmbedderPolicy: false,
  })
);

// CORS
const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
app.use(
  cors({
    origin: [clientOrigin, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
  })
);

// Body Parsing & Cookies
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(process.env.COOKIE_SECRET || 'iilm_ev_cookie_signing_secret_dev_2026!'));

// Rate Limiting for Auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, // Generous for local development and viva demonstrations
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { message: 'Too many requests, please try again later.' } },
});
app.use('/api/v1/auth/login', authLimiter);
app.use('/api/v1/auth/register', authLimiter);

// Health Check
app.get('/api/health', async (req: Request, res: Response) => {
  try {
    await db.query('SELECT 1');
    res.json({
      status: 'UP',
      timestamp: new Date().toISOString(),
      database: 'CONNECTED',
      engine: db.getEngineMode(),
      institution: 'IILM University, Greater Noida',
      project: 'EV Charging Reservation and Real-Time Availability System',
    });
  } catch (err: any) {
    res.status(500).json({
      status: 'DOWN',
      timestamp: new Date().toISOString(),
      database: 'DISCONNECTED',
      error: err.message,
    });
  }
});

// Project Information Endpoint
app.get('/api/project-info', (req: Request, res: Response) => {
  res.json({
    institution: 'IILM University, Greater Noida',
    department: 'Department of Computer Science and Engineering',
    degree: 'B.Tech CSE',
    projectTitle: 'EV Charging Reservation and Real-Time Availability System',
    projectType: 'Full-Stack Web Application (Phase I Functional Prototype & Concurrency Engine)',
    waitingListAlgorithm: 'P_i = 0.50 * U_i + 0.30 * T_i + 0.20 * R_i',
    concurrencyProtection: 'PostgreSQL ACID Serializable Transactions + Interval Overlap Locking',
  });
});

// Mount Versioned API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/stations', stationsRoutes);
app.use('/api/v1/reservations', reservationsRoutes);
app.use('/api/v1/waiting-list', waitingListRoutes);
app.use('/api/v1/admin', adminRoutes);

// 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      message: `Endpoint ${req.method} ${req.originalUrl} not found on this server.`,
    },
  });
});

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[Unhandled Error]', err);
  res.status(err.status || 500).json({
    success: false,
    error: {
      message: err.message || 'Internal server error occurred.',
      ...(process.env.NODE_ENV !== 'production' ? { stack: err.stack } : {}),
    },
  });
});

