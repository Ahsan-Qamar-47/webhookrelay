import { Router } from 'express';
import {
  listEndpoints,
  createEndpoint,
  getEndpointById,
  deleteEndpoint,
  resetEndpoint,
  getEndpointEvents,
} from '../controllers/endpointController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Protect all endpoint routes
router.use(authenticate);

router.get('/', listEndpoints);
router.post('/', createEndpoint);
router.get('/:id', getEndpointById);
router.get('/:id/events', getEndpointEvents);
router.delete('/:id', deleteEndpoint);
router.post('/:id/reset', resetEndpoint);

export default router;
