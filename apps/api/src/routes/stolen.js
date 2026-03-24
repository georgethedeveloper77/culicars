"use strict";
// apps/api/src/routes/stolen.ts
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const stolenReportService_1 = require("../services/stolenReportService");
const requireRole_1 = require("../middleware/requireRole");
const stolenValidator_1 = require("../validators/stolenValidator");
const router = (0, express_1.Router)();
// ---------------------------------------------------------------------------
// POST /stolen-reports
// Public — no account required
// ---------------------------------------------------------------------------
router.post('/', async (req, res, next) => {
    try {
        const validation = (0, stolenValidator_1.validateStolenSubmission)(req.body);
        if (!validation.valid) {
            return res.status(400).json({ error: 'Validation failed', details: validation.errors });
        }
        const userId = req.user?.id ?? null;
        const report = await (0, stolenReportService_1.submitReport)(req.body, userId);
        return res.status(201).json({
            report,
            message: 'Your report has been received and is under review. We will contact you if we need more information.',
        });
    }
    catch (err) {
        const typed = err;
        if (typed.status === 409) {
            return res.status(409).json({ error: typed.message });
        }
        next(err);
    }
});
// ---------------------------------------------------------------------------
// GET /stolen-reports/plate/:plate  — FREE, no credits
// ---------------------------------------------------------------------------
router.get('/plate/:plate', async (req, res, next) => {
    try {
        const reports = await (0, stolenReportService_1.getByPlate)(req.params.plate);
        const hasActiveReport = reports.some((r) => r.status === 'active');
        return res.json({ hasActiveReport, reports });
    }
    catch (err) {
        next(err);
    }
});
// ---------------------------------------------------------------------------
// GET /stolen-reports/vin/:vin  — FREE, no credits
// ---------------------------------------------------------------------------
router.get('/vin/:vin', async (req, res, next) => {
    try {
        const reports = await (0, stolenReportService_1.getByVin)(req.params.vin);
        const hasActiveReport = reports.some((r) => r.status === 'active');
        return res.json({ hasActiveReport, reports });
    }
    catch (err) {
        next(err);
    }
});
// ---------------------------------------------------------------------------
// GET /stolen-reports/:id
// ---------------------------------------------------------------------------
router.get('/:id', async (req, res, next) => {
    try {
        const report = await (0, stolenReportService_1.getById)(req.params.id);
        if (!report) {
            return res.status(404).json({ error: 'Report not found' });
        }
        // Hide contact info from non-admin, non-reporter
        const reqWithUser = req;
        const isAdmin = reqWithUser.user?.role === 'admin';
        const isReporter = reqWithUser.user?.id === report.reporterUserId;
        if (!isAdmin && !isReporter) {
            const { contactPhone: _, contactEmail: __, ...safeReport } = report;
            return res.json({ report: safeReport });
        }
        return res.json({ report });
    }
    catch (err) {
        next(err);
    }
});
// ---------------------------------------------------------------------------
// PATCH /stolen-reports/:id/review  (admin only)
// ---------------------------------------------------------------------------
router.patch('/:id/review', (0, requireRole_1.requireRole)('admin'), async (req, res, next) => {
    try {
        const { status, adminNote, isObVerified } = req.body;
        if (!['active', 'rejected', 'duplicate'].includes(status)) {
            return res.status(400).json({
                error: 'status must be one of: active, rejected, duplicate',
            });
        }
        const adminUserId = req.user.id;
        const report = await (0, stolenReportService_1.reviewReport)(req.params.id, { status, adminNote, isObVerified }, adminUserId);
        return res.json({ report });
    }
    catch (err) {
        next(err);
    }
});
// ---------------------------------------------------------------------------
// POST /stolen-reports/:id/recovered
// Owner (or admin) marks vehicle as recovered
// ---------------------------------------------------------------------------
router.post('/:id/recovered', async (req, res, next) => {
    try {
        const validation = (0, stolenValidator_1.validateRecoverySubmission)(req.body);
        if (!validation.valid) {
            return res.status(400).json({ error: 'Validation failed', details: validation.errors });
        }
        const userId = req.user?.id ?? null;
        const report = await (0, stolenReportService_1.markRecovered)(req.params.id, req.body, userId);
        return res.json({
            report,
            message: 'Thank you for updating us. The vehicle has been marked as recovered.',
        });
    }
    catch (err) {
        const typed = err;
        if (typed.status === 400 || typed.status === 403) {
            return res.status(typed.status).json({ error: typed.message });
        }
        next(err);
    }
});
exports.default = router;
