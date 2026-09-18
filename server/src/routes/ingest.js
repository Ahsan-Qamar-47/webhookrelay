import { Router } from 'express';
import { handleIngest } from '../controllers/ingestController.js';

const router = Router();

// Support all standard HTTP verbs (POST, GET, PUT, PATCH, DELETE) at /ingest/:tunnelId
router.all('/:tunnelId', handleIngest);

export default router;
