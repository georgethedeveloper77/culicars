"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
// apps/api/src/routes/auth.ts
const express_1 = require("express");
const zod_1 = require("zod");
const authService_1 = require("../services/authService");
const auth_1 = require("../middleware/auth");
const requireRole_1 = require("../middleware/requireRole");
const router = (0, express_1.Router)();
exports.authRouter = router;
// ── POST /auth/complete-profile ──────────────────────────────────────────────
const completeProfileSchema = zod_1.z.object({
    display_name: zod_1.z.string().min(1).max(100).optional(),
    phone: zod_1.z.string().optional(),
});
router.post('/complete-profile', auth_1.auth, async (req, res, next) => {
    try {
        const body = completeProfileSchema.parse(req.body);
        const profile = await authService_1.authService.completeProfile(req.user.id, body);
        res.json({ success: true, profile });
    }
    catch (err) {
        next(err);
    }
});
// ── GET /auth/me ──────────────────────────────────────────────────────────────
router.get('/me', auth_1.auth, async (req, res, next) => {
    try {
        const profile = await authService_1.authService.getProfile(req.user.id);
        if (!profile)
            return res.status(404).json({ error: 'NOT_FOUND', message: 'Profile not found' });
        res.json(profile);
    }
    catch (err) {
        next(err);
    }
});
// ── PATCH /auth/profile ───────────────────────────────────────────────────────
const updateProfileSchema = zod_1.z.object({
    display_name: zod_1.z.string().min(1).max(100).optional(),
    phone: zod_1.z.string().optional(),
    preferred_location_lat: zod_1.z.number().optional(),
    preferred_location_lng: zod_1.z.number().optional(),
});
router.patch('/profile', auth_1.auth, async (req, res, next) => {
    try {
        const body = updateProfileSchema.parse(req.body);
        const profile = await authService_1.authService.updateProfile(req.user.id, body);
        res.json({ success: true, profile });
    }
    catch (err) {
        next(err);
    }
});
// ── POST /auth/assign-role ────────────────────────────────────────────────────
const assignRoleSchema = zod_1.z.object({
    user_id: zod_1.z.string().uuid(),
    role: zod_1.z.enum(['user', 'admin', 'employee', 'dealer']),
});
router.post('/assign-role', auth_1.auth, (0, requireRole_1.requireRole)('admin'), async (req, res, next) => {
    try {
        const { user_id, role } = assignRoleSchema.parse(req.body);
        const updated = await authService_1.authService.assignRole(user_id, role);
        res.json({ success: true, user: updated });
    }
    catch (err) {
        next(err);
    }
});
// ── GET /auth/users ───────────────────────────────────────────────────────────
router.get('/users', auth_1.auth, (0, requireRole_1.requireRole)('admin', 'employee'), async (req, res, next) => {
    try {
        const page = parseInt(req.query.page ?? '1', 10);
        const limit = Math.min(parseInt(req.query.limit ?? '20', 10), 100);
        const role = req.query.role;
        const result = await authService_1.authService.listUsers({ page, limit, role });
        res.json(result);
    }
    catch (err) {
        next(err);
    }
});
// ── GET /auth/users/:id ───────────────────────────────────────────────────────
router.get('/users/:id', auth_1.auth, (0, requireRole_1.requireRole)('admin', 'employee'), async (req, res, next) => {
    try {
        const profile = await authService_1.authService.getProfile(req.params.id);
        if (!profile)
            return res.status(404).json({ error: 'NOT_FOUND', message: 'User not found' });
        res.json(profile);
    }
    catch (err) {
        next(err);
    }
});
