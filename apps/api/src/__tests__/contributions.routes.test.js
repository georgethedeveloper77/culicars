"use strict";
// apps/api/src/__tests__/contributions.routes.test.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
const contributions_1 = __importDefault(require("../routes/contributions"));
const errorHandler_1 = require("../middleware/errorHandler");
// ── Mock all service layer calls ──────────────────
vitest_1.vi.mock('../services/contributionService.js', () => ({
    submitContribution: vitest_1.vi.fn(),
    getContributionsByVin: vitest_1.vi.fn(),
    moderateContribution: vitest_1.vi.fn(),
    getContributionById: vitest_1.vi.fn(),
}));
vitest_1.vi.mock('../services/contributionValidator.js', () => ({
    validateContributionSubmission: vitest_1.vi.fn(),
}));
vitest_1.vi.mock('../middleware/requireRole.js', () => ({
    requireRole: () => (req, res, next) => {
        const user = req.user;
        if (!user || user.role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden' });
        }
        next();
    },
}));
const contributionService_js_1 = require("../services/contributionService.js");
const contributionValidator_js_1 = require("../services/contributionValidator.js");
// Helper to build a test app with optional user attached
function buildApp(user) {
    const app = (0, express_1.default)();
    app.use(express_1.default.json());
    if (user) {
        app.use((req, _res, next) => {
            req.user = user;
            next();
        });
    }
    app.use('/contributions', contributions_1.default);
    app.use(errorHandler_1.errorHandler);
    return app;
}
const mockContrib = {
    id: 'contrib-001',
    vin: 'JTDBR32E540012345',
    userId: null,
    type: 'SERVICE_RECORD',
    title: 'Oil change',
    description: null,
    data: {},
    evidenceUrls: [],
    verificationDocUrls: [],
    status: 'pending',
    adminNote: null,
    reviewedBy: null,
    reviewedAt: null,
    confidenceScore: 0.42,
    createdAt: new Date().toISOString(),
};
(0, vitest_1.beforeEach)(() => vitest_1.vi.clearAllMocks());
// ---------------------------------------------------------------------------
// POST /contributions
// ---------------------------------------------------------------------------
(0, vitest_1.describe)('POST /contributions', () => {
    (0, vitest_1.it)('returns 201 on valid submission (anonymous)', async () => {
        vitest_1.vi.mocked(contributionValidator_js_1.validateContributionSubmission).mockReturnValue({ valid: true, errors: [] });
        vitest_1.vi.mocked(contributionService_js_1.submitContribution).mockResolvedValue(mockContrib);
        const res = await (0, supertest_1.default)(buildApp())
            .post('/contributions')
            .send({ vin: 'JTDBR32E540012345', type: 'SERVICE_RECORD', title: 'Oil change' });
        (0, vitest_1.expect)(res.status).toBe(201);
        (0, vitest_1.expect)(res.body.contribution.id).toBe('contrib-001');
        (0, vitest_1.expect)(contributionService_js_1.submitContribution).toHaveBeenCalledWith(vitest_1.expect.objectContaining({ vin: 'JTDBR32E540012345' }), null);
    });
    (0, vitest_1.it)('passes user id when authenticated', async () => {
        vitest_1.vi.mocked(contributionValidator_js_1.validateContributionSubmission).mockReturnValue({ valid: true, errors: [] });
        vitest_1.vi.mocked(contributionService_js_1.submitContribution).mockResolvedValue(mockContrib);
        await (0, supertest_1.default)(buildApp({ id: 'user-abc', role: 'user' }))
            .post('/contributions')
            .send({ vin: 'JTDBR32E540012345', type: 'SERVICE_RECORD', title: 'Oil change' });
        (0, vitest_1.expect)(contributionService_js_1.submitContribution).toHaveBeenCalledWith(vitest_1.expect.anything(), 'user-abc');
    });
    (0, vitest_1.it)('returns 400 when validation fails', async () => {
        vitest_1.vi.mocked(contributionValidator_js_1.validateContributionSubmission).mockReturnValue({
            valid: false,
            errors: ['vin is required', 'type is required'],
        });
        const res = await (0, supertest_1.default)(buildApp()).post('/contributions').send({});
        (0, vitest_1.expect)(res.status).toBe(400);
        (0, vitest_1.expect)(res.body.details).toContain('vin is required');
    });
    (0, vitest_1.it)('propagates service errors to errorHandler', async () => {
        vitest_1.vi.mocked(contributionValidator_js_1.validateContributionSubmission).mockReturnValue({ valid: true, errors: [] });
        vitest_1.vi.mocked(contributionService_js_1.submitContribution).mockRejectedValue(Object.assign(new Error('Vehicle not found: X'), { status: 404 }));
        const res = await (0, supertest_1.default)(buildApp())
            .post('/contributions')
            .send({ vin: 'BADVIN12345678901', type: 'SERVICE_RECORD', title: 'Test' });
        (0, vitest_1.expect)(res.status).toBeGreaterThanOrEqual(400);
    });
});
// ---------------------------------------------------------------------------
// GET /contributions/vin/:vin
// ---------------------------------------------------------------------------
(0, vitest_1.describe)('GET /contributions/vin/:vin', () => {
    (0, vitest_1.it)('returns approved-only contributions for non-admin', async () => {
        vitest_1.vi.mocked(contributionService_js_1.getContributionsByVin).mockResolvedValue([mockContrib]);
        const res = await (0, supertest_1.default)(buildApp())
            .get('/contributions/vin/JTDBR32E540012345');
        (0, vitest_1.expect)(res.status).toBe(200);
        (0, vitest_1.expect)(contributionService_js_1.getContributionsByVin).toHaveBeenCalledWith('JTDBR32E540012345', false);
    });
    (0, vitest_1.it)('passes includeAll=true for admin', async () => {
        vitest_1.vi.mocked(contributionService_js_1.getContributionsByVin).mockResolvedValue([mockContrib]);
        await (0, supertest_1.default)(buildApp({ id: 'admin-id', role: 'admin' }))
            .get('/contributions/vin/JTDBR32E540012345');
        (0, vitest_1.expect)(contributionService_js_1.getContributionsByVin).toHaveBeenCalledWith('JTDBR32E540012345', true);
    });
});
// ---------------------------------------------------------------------------
// GET /contributions/:id
// ---------------------------------------------------------------------------
(0, vitest_1.describe)('GET /contributions/:id', () => {
    (0, vitest_1.it)('returns approved contribution to anonymous user', async () => {
        vitest_1.vi.mocked(contributionService_js_1.getContributionById).mockResolvedValue({
            ...mockContrib,
            status: 'approved',
        });
        const res = await (0, supertest_1.default)(buildApp()).get('/contributions/contrib-001');
        (0, vitest_1.expect)(res.status).toBe(200);
        (0, vitest_1.expect)(res.body.contribution.id).toBe('contrib-001');
    });
    (0, vitest_1.it)('returns 403 for pending contribution viewed by non-owner', async () => {
        vitest_1.vi.mocked(contributionService_js_1.getContributionById).mockResolvedValue({
            ...mockContrib,
            status: 'pending',
            userId: 'owner-id',
        });
        const res = await (0, supertest_1.default)(buildApp({ id: 'other-user', role: 'user' }))
            .get('/contributions/contrib-001');
        (0, vitest_1.expect)(res.status).toBe(403);
    });
    (0, vitest_1.it)('returns 404 when not found', async () => {
        vitest_1.vi.mocked(contributionService_js_1.getContributionById).mockResolvedValue(null);
        const res = await (0, supertest_1.default)(buildApp()).get('/contributions/missing');
        (0, vitest_1.expect)(res.status).toBeGreaterThanOrEqual(400);
    });
});
// ---------------------------------------------------------------------------
// PATCH /contributions/:id/moderate
// ---------------------------------------------------------------------------
(0, vitest_1.describe)('PATCH /contributions/:id/moderate', () => {
    (0, vitest_1.it)('returns 403 for non-admin', async () => {
        const res = await (0, supertest_1.default)(buildApp({ id: 'user-id', role: 'user' }))
            .patch('/contributions/contrib-001/moderate')
            .send({ status: 'approved' });
        (0, vitest_1.expect)(res.status).toBe(403);
        (0, vitest_1.expect)(contributionService_js_1.moderateContribution).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)('approves contribution as admin', async () => {
        vitest_1.vi.mocked(contributionService_js_1.moderateContribution).mockResolvedValue({
            ...mockContrib,
            status: 'approved',
        });
        const res = await (0, supertest_1.default)(buildApp({ id: 'admin-id', role: 'admin' }))
            .patch('/contributions/contrib-001/moderate')
            .send({ status: 'approved' });
        (0, vitest_1.expect)(res.status).toBe(200);
        (0, vitest_1.expect)(res.body.contribution.status).toBe('approved');
        (0, vitest_1.expect)(contributionService_js_1.moderateContribution).toHaveBeenCalledWith('contrib-001', { status: 'approved', adminNote: undefined }, 'admin-id');
    });
    (0, vitest_1.it)('rejects with note as admin', async () => {
        vitest_1.vi.mocked(contributionService_js_1.moderateContribution).mockResolvedValue({
            ...mockContrib,
            status: 'rejected',
            adminNote: 'Duplicate submission',
        });
        const res = await (0, supertest_1.default)(buildApp({ id: 'admin-id', role: 'admin' }))
            .patch('/contributions/contrib-001/moderate')
            .send({ status: 'rejected', adminNote: 'Duplicate submission' });
        (0, vitest_1.expect)(res.status).toBe(200);
        (0, vitest_1.expect)(res.body.contribution.adminNote).toBe('Duplicate submission');
    });
    (0, vitest_1.it)('returns 400 for invalid status', async () => {
        const res = await (0, supertest_1.default)(buildApp({ id: 'admin-id', role: 'admin' }))
            .patch('/contributions/contrib-001/moderate')
            .send({ status: 'banana' });
        (0, vitest_1.expect)(res.status).toBe(400);
        (0, vitest_1.expect)(contributionService_js_1.moderateContribution).not.toHaveBeenCalled();
    });
});
