import { Router } from 'express';
import {
  updateProfile,
  getVehicles,
  addVehicle,
  deleteVehicle,
  getNotifications,
  markNotificationRead,
  updateProfileSchema,
  addVehicleSchema,
} from './users.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { validateRequest } from '../../middleware/validation.js';

const router = Router();

router.use(authenticate);

router.patch('/me', validateRequest({ body: updateProfileSchema }), updateProfile);
router.get('/vehicles', getVehicles);
router.post('/vehicles', validateRequest({ body: addVehicleSchema }), addVehicle);
router.delete('/vehicles/:id', deleteVehicle);
router.get('/notifications', getNotifications);
router.post('/notifications/:id/read', markNotificationRead);

export default router;

