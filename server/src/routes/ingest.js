import { Router } from 'express';

const router = Router();

router.post('/:tunnelId', (req, res) => {
  const { tunnelId } = req.params;

  // TODO: Publish to Redis or push to WS directly
  res.status(202).json({
    message: 'Webhook received',
    tunnelId
  });
});

export default router;
