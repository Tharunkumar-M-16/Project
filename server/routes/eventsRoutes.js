import express from 'express';
import { protectQuery } from '../middleware/auth.js';
import { addClient, removeClient } from '../services/events.js';

const router = express.Router();

// GET /api/events?token=JWT — Server-Sent Events stream for real-time notifications.
// EventSource can't send headers, so the token comes as a query param.
router.get('/', protectQuery, (req, res) => {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no', // disable proxy buffering (nginx)
  });
  res.flushHeaders?.();
  res.write(`event: connected\ndata: {"ok":true}\n\n`);

  addClient(req.user._id, res);
  const heartbeat = setInterval(() => res.write(': ping\n\n'), 25000);

  req.on('close', () => {
    clearInterval(heartbeat);
    removeClient(req.user._id, res);
  });
});

export default router;
