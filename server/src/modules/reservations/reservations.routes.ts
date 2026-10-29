import { Router } from 'express';
import {
  createReservation,
  getReservations,
  getReservationById,
  cancelReservation,
  checkInReservation,
  createReservationSchema,
  cancelReservationSchema,
} from './reservations.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { validateRequest } from '../../middleware/validation.js';

const router = Router();

router.use(authenticate);

router.post('/', validateRequest({ body: createReservationSchema }), createReservation);
router.get('/', getReservations);
router.get('/:id', getReservationById);
router.post('/:id/cancel', validateRequest({ body: cancelReservationSchema }), cancelReservation);
router.post('/:id/check-in', checkInReservation);

export default router;

