import { Router } from 'express';
import { createToken, listTokens, deleteToken } from '../controllers/tokenController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Protect all token routes
router.use(authenticate);

router.post('/', createToken);
router.get('/', listTokens);
router.delete('/:id', deleteToken);

export default router;
