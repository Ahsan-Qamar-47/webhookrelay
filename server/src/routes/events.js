import { Router } from 'express';
import { getEventById } from '../controllers/eventController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/:id', getEventById);

export default router;
