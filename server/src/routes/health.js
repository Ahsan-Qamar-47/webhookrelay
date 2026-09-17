import { Router } from 'express';
import { checkDbHealth } from '../config/db.js';

const router = Router();

router.get('/', async (req, res) => {
  const dbHealth = await checkDbHealth();
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    db: dbHealth,
  });
});

export default router;
