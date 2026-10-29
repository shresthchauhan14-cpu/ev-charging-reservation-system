import { Router } from 'express';
import { getStations, getStationById, getStationAvailability } from './stations.controller.js';

const router = Router();

router.get('/', getStations);
router.get('/:id', getStationById);
router.get('/:id/availability', getStationAvailability);

export default router;

