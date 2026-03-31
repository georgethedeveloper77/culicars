// apps/api/src/routes/auth.ts
import { Router as ExpressRouter, Request, Response, NextFunction } from 'express';
import type { Router } from 'express';
import { z } from 'zod';
import { authService } from '../services/authService';
import { auth } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';

const router: Router = ExpressRouter();

// ── POST /auth/complete-profile ──────────────────────────────────────────────
const completeProfileSchema = z.object({
  display_name: z.string().min(1).max(100).optional(),
  phone: z.string().optional(),
});

router.post(
  '/complete-profile',
  auth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = completeProfileSchema.parse(req.body);
      const profile = await authService.completeProfile(req.user!.id, body);
      res.json({ success: true, profile });
    } catch (err) {
      next(err);
    }
  }
);

// ── GET /auth/me ──────────────────────────────────────────────────────────────
router.get('/me', auth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profile = await authService.getProfile(req.user!.id);
    if (!profile) return res.status(404).json({ error: 'NOT_FOUND', message: 'Profile not found' });
    res.json(profile);
  } catch (err) {
    next(err);
  }
});

// ── PATCH /auth/profile ───────────────────────────────────────────────────────
const updateProfileSchema = z.object({
  display_name: z.string().min(1).max(100).optional(),
  phone: z.string().optional(),
  preferred_location_lat: z.number().optional(),
  preferred_location_lng: z.number().optional(),
});

router.patch('/profile', auth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = updateProfileSchema.parse(req.body);
    const profile = await authService.updateProfile(req.user!.id, body);
    res.json({ success: true, profile });
  } catch (err) {
    next(err);
  }
});

// ── POST /auth/assign-role ────────────────────────────────────────────────────
const assignRoleSchema = z.object({
  user_id: z.string().uuid(),
  role: z.enum(['user', 'admin', 'employee', 'dealer']),
});

router.post(
  '/assign-role',
  auth,
  requireRole('admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { user_id, role } = assignRoleSchema.parse(req.body);
      const updated = await authService.assignRole(user_id, role);
      res.json({ success: true, user: updated });
    } catch (err) {
      next(err);
    }
  }
);

// ── GET /auth/users ───────────────────────────────────────────────────────────
router.get(
  '/users',
  auth,
  requireRole(['admin', 'employee']),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt((req.query.page as string) ?? '1', 10);
      const limit = Math.min(parseInt((req.query.limit as string) ?? '20', 10), 100);
      const role = req.query.role as string | undefined;
      const result = await authService.listUsers({ page, limit, role });
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

// ── GET /auth/users/:id ───────────────────────────────────────────────────────
router.get(
  '/users/:id',
  auth,
  requireRole(['admin', 'employee']),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profile = await authService.getProfile(req.params.id);
      if (!profile) return res.status(404).json({ error: 'NOT_FOUND', message: 'User not found' });
      res.json(profile);
    } catch (err) {
      next(err);
    }
  }
);

export { router as authRouter };

// ── QA-compatible login/register via Supabase ─────────────────────────────
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

router.post('/register', async (req, res, next) => {
  try {
    const { email, password, name } = req.body;
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email, password,
      user_metadata: { name },
      email_confirm: true,
    });
    if (error) return res.status(400).json({ error: 'REGISTER_FAILED', message: error.message });
    return res.json({ success: true, data: { user: data.user } });
  } catch (err) { next(err); }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const supabaseClient = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) return res.status(401).json({ error: 'UNAUTHORIZED', message: error.message });
    return res.json({ success: true, token: data.session.access_token, user: data.user });
  } catch (err) { next(err); }
});
