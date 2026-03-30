// apps/api/src/routes/notifications.ts

import { Router, Request, Response } from 'express';
import { auth } from '../middleware/auth';
import {
  getNotifications,
  markRead,
  markAllRead,
  getUnreadCount,
  registerDeviceToken,
  removeDeviceToken,
} from '../services/notificationService';

const router: ReturnType<typeof Router> = Router();

// GET /notifications — in-app inbox
router.get('/', auth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const limit = Math.min(parseInt(String(req.query.limit ?? '30')), 100);
    const items = await getNotifications(userId, limit);
    const unread = await getUnreadCount(userId);
    res.json({ notifications: items, unreadCount: unread });
  } catch (err) {
    console.error('[GET /notifications]', err);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// PATCH /notifications/:id/read
router.patch('/:id/read', auth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    await markRead(userId, req.params.id);
    res.json({ ok: true });
  } catch (err) {
    console.error('[PATCH /notifications/:id/read]', err);
    res.status(500).json({ error: 'Failed to mark notification read' });
  }
});

// POST /notifications/read-all
router.post('/read-all', auth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    await markAllRead(userId);
    res.json({ ok: true });
  } catch (err) {
    console.error('[POST /notifications/read-all]', err);
    res.status(500).json({ error: 'Failed to mark all read' });
  }
});

// POST /notifications/register-device
router.post('/register-device', auth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { token, platform } = req.body as { token?: string; platform?: string };
    if (!token || !platform) {
      return res.status(400).json({ error: 'token and platform are required' });
    }
    if (!['ios', 'android', 'web'].includes(platform)) {
      return res.status(400).json({ error: 'platform must be ios | android | web' });
    }
    await registerDeviceToken(userId, token, platform);
    res.json({ ok: true });
  } catch (err) {
    console.error('[POST /notifications/register-device]', err);
    res.status(500).json({ error: 'Failed to register device token' });
  }
});

// DELETE /notifications/device
router.delete('/device', auth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { token } = req.body as { token?: string };
    if (!token) return res.status(400).json({ error: 'token is required' });
    await removeDeviceToken(userId, token);
    res.json({ ok: true });
  } catch (err) {
    console.error('[DELETE /notifications/device]', err);
    res.status(500).json({ error: 'Failed to remove device token' });
  }
});

export default router;
