import { Router } from 'express';
import {
  getAdminDashboard,
  createStation,
  updateStation,
  addChargingPoint,
  updateChargingPoint,
  simulateNoShow,
  resetDemoData,
  getAnalytics,
  createStationSchema,
  updateStationSchema,
  createChargingPointSchema,
  updateChargingPointSchema,
} from './admin.controller.js';
import { authenticate, requireRole } from '../../middleware/auth.js';
import { validateRequest } from '../../middleware/validation.js';

const router = Router();

// All admin routes require ADMIN or SUPER_ADMIN role
router.use(authenticate, requireRole('ADMIN', 'SUPER_ADMIN'));

router.get('/dashboard', getAdminDashboard);
router.post('/stations', validateRequest({ body: createStationSchema }), createStation);
router.patch('/stations/:id', validateRequest({ body: updateStationSchema }), updateStation);
router.post('/stations/:id/charging-points', validateRequest({ body: createChargingPointSchema }), addChargingPoint);
router.patch('/charging-points/:id', validateRequest({ body: updateChargingPointSchema }), updateChargingPoint);
router.post('/reservations/:id/simulate-noshow', simulateNoShow);
router.post('/reset-demo-data', resetDemoData);
router.get('/analytics', getAnalytics);

export default router;

