"use strict";
// apps/api/src/routes/contributions.ts
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const contributionValidator_1 = require("../services/contributionValidator");
const contributionService_1 = require("../services/contributionService");
const requireRole_1 = require("../middleware/requireRole");
const router = (0, express_1.Router)();
// ---------------------------------------------------------------------------
// POST /contributions
// Submit a new contribution — no account required (optionalAuth applied in app.ts)
// ---------------------------------------------------------------------------
router.post('/', async (req, res, next) => {
    try {
        const validation = (0, contributionValidator_1.validateContributionSubmission)(req.body);
        if (!validation.valid) {
            return res.status(400).json({ error: 'Validation failed', details: validation.errors });
        }
        const userId = req.user?.id ?? null;
        const contribution = await (0, contributionService_1.submitContribution)(req.body, userId);
        return res.status(201).json({ contribution });
    }
    catch (err) {
        next(err);
    }
});
// ---------------------------------------------------------------------------
// GET /contributions/vin/:vin
// List approved contributions for a vehicle
// Admin gets all (pending, flagged, rejected too)
// ---------------------------------------------------------------------------
router.get('/vin/:vin', async (req, res, next) => {
    try {
        const isAdmin = req.user?.role === 'admin';
        const contributions = await (0, contributionService_1.getContributionsByVin)(req.params.vin, isAdmin);
        return res.json({ contributions });
    }
    catch (err) {
        next(err);
    }
});
// ---------------------------------------------------------------------------
// GET /contributions/:id
// Get a single contribution (admin or owner)
// ---------------------------------------------------------------------------
router.get('/:id', async (req, res, next) => {
    try {
        const contribution = await (0, contributionService_1.getContributionById)(req.params.id);
        if (!contribution) {
            return res.status(404).json({ error: 'Contribution not found' });
        }
        const reqWithUser = req;
        const userId = reqWithUser.user?.id;
        const isAdmin = reqWithUser.user?.role === 'admin';
        const isOwner = contribution.userId === userId;
        if (!isAdmin && !isOwner && contribution.status !== 'approved') {
            return res.status(403).json({ error: 'Forbidden' });
        }
        return res.json({ contribution });
    }
    catch (err) {
        next(err);
    }
});
// ---------------------------------------------------------------------------
// PATCH /contributions/:id/moderate  (admin only)
// ---------------------------------------------------------------------------
router.patch('/:id/moderate', (0, requireRole_1.requireRole)('admin'), async (req, res, next) => {
    try {
        const { status, adminNote } = req.body;
        if (!['approved', 'rejected', 'flagged'].includes(status)) {
            return res.status(400).json({
                error: 'status must be one of: approved, rejected, flagged',
            });
        }
        const adminUserId = req.user.id;
        const contribution = await (0, contributionService_1.moderateContribution)(req.params.id, { status, adminNote }, adminUserId);
        return res.json({ contribution });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
