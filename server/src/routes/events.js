import { Router } from 'express';
import { getEventById, replayEvent } from '../controllers/eventController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/:id', getEventById);
router.post('/:id/replay', replayEvent);

export default router;
