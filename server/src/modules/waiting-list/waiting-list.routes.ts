import { Router } from 'express';
import {
  joinWaitingList,
  getWaitingList,
  cancelWaitingListEntry,
  simulateSlotAllocation,
  joinWaitingListSchema,
} from './waiting-list.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { validateRequest } from '../../middleware/validation.js';

const router = Router();

router.use(authenticate);

router.post('/', validateRequest({ body: joinWaitingListSchema }), joinWaitingList);
router.get('/', getWaitingList);
router.delete('/:id', cancelWaitingListEntry);
router.post('/simulate-allocation', simulateSlotAllocation);

export default router;

