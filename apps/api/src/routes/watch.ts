// apps/api/src/routes/watch.ts
import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { auth } from '../middleware/auth';
import { optionalAuth } from '../middleware/optionalAuth';
import { requireRole } from '../middleware/requireRole';
import { watchAlertService, AlertType, AlertStatus } from '../services/watchAlertService';

const router: Router = Router();

const ALERT_TYPES = [
  'stolen_vehicle',
  'recovered_vehicle',
  'damage',
  'vandalism',
  'parts_theft',
  'suspicious_activity',
  'hijack',
] as const;

const ALERT_STATUSES = [
  'pending',
  'approved',
  'rejected',
  'disputed',
  'needs_more_info',
  'archived',
] as const;

const MODERATION_STATUSES = ['approved', 'rejected', 'disputed', 'needs_more_info', 'archived'] as const;

// ── POST /watch/alerts ────────────────────────────────────────────────────────
// Submit a new watch alert. Auth required.
router.post(
  '/alerts',
  auth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const schema = z.object({
        plate: z.string().optional(),
        vin: z.string().optional(),
        type: z.enum(ALERT_TYPES),
        lat: z.number().min(-90).max(90).optional(),
        lng: z.number().min(-180).max(180).optional(),
        locationName: z.string().max(200).optional(),
        description: z.string().min(10).max(1000),
        evidenceUrls: z.array(z.string().url()).max(5).optional(),
      });

      const body = schema.parse(req.body);
      const alert = await watchAlertService.submit({
        ...body,
        submittedBy: req.user!.id,
      });

      res.status(201).json({ success: true, data: alert });
    } catch (err) {
      next(err);
    }
  }
);

// ── GET /watch/alerts ─────────────────────────────────────────────────────────
// Public feed — returns approved alerts only. Optional auth.
router.get(
  '/alerts',
  optionalAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const schema = z.object({
        type: z.enum(ALERT_TYPES).optional(),
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(50).default(20),
      });

      const query = schema.parse(req.query);
      const result = await watchAlertService.listPublic(query);

      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);

// ── GET /watch/alerts/:id ─────────────────────────────────────────────────────
// Get a single alert. Returns approved alerts publicly; admin sees all.
router.get(
  '/alerts/:id',
  optionalAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const alert = await watchAlertService.getById(req.params.id);

      const isAdmin = ['admin', 'employee'].includes(req.user?.role ?? '');
      if (alert.status !== 'approved' && !isAdmin) {
        return res.status(404).json({ success: false, error: 'Alert not found' });
      }

      res.json({ success: true, data: alert });
    } catch (err) {
      next(err);
    }
  }
);

// ── PATCH /watch/alerts/:id/moderate ─────────────────────────────────────────
// Admin/employee only — moderate an alert.
router.patch(
  '/alerts/:id/moderate',
  auth,
  requireRole('admin' as any),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const schema = z.object({
        status: z.enum(MODERATION_STATUSES),
        moderationNote: z.string().max(500).optional(),
      });

      const body = schema.parse(req.body);

      // Employees cannot archive (destructive config-level action)
      if (body.status === 'archived' && req.user!.role !== 'admin') {
        return res.status(403).json({ success: false, error: 'Only admins can archive alerts' });
      }

      const alert = await watchAlertService.moderate({
        alertId: req.params.id,
        status: body.status as AlertStatus,
        moderatedBy: req.user!.id,
        moderationNote: body.moderationNote,
      });

      res.json({ success: true, data: alert });
    } catch (err) {
      next(err);
    }
  }
);

// ── GET /watch/admin/queue ────────────────────────────────────────────────────
// Admin queue — all alerts with full details. Employee and admin only.
router.get(
  '/admin/queue',
  auth,
  requireRole('admin' as any),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const schema = z.object({
        status: z.enum(ALERT_STATUSES).optional(),
        type: z.enum(ALERT_TYPES).optional(),
        plate: z.string().optional(),
        vin: z.string().optional(),
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(100).default(20),
      });

      const query = schema.parse(req.query);
      const result = await watchAlertService.listForAdmin(query);

      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);

// ── GET /watch/admin/pending-count ────────────────────────────────────────────
router.get(
  '/admin/pending-count',
  auth,
  requireRole('admin' as any),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const count = await watchAlertService.pendingCount();
      res.json({ success: true, data: { count } });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
