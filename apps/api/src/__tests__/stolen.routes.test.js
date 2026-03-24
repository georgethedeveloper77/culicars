"use strict";
// apps/api/src/__tests__/stolen.routes.test.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
const stolen_1 = __importDefault(require("../routes/stolen"));
const errorHandler_1 = require("../middleware/errorHandler");
// ── Mock service + validator layers ──────────────
vitest_1.vi.mock('../services/stolenReportService.js', () => ({
    submitReport: vitest_1.vi.fn(),
    getByPlate: vitest_1.vi.fn(),
    getByVin: vitest_1.vi.fn(),
    getById: vitest_1.vi.fn(),
    reviewReport: vitest_1.vi.fn(),
    markRecovered: vitest_1.vi.fn(),
}));
vitest_1.vi.mock('../validators/stolenValidator.js', () => ({
    validateStolenSubmission: vitest_1.vi.fn(),
    validateRecoverySubmission: vitest_1.vi.fn(),
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
const stolenReportService_js_1 = require("../services/stolenReportService.js");
const stolenValidator_js_1 = require("../validators/stolenValidator.js");
function buildApp(user) {
    const app = (0, express_1.default)();
    app.use(express_1.default.json());
    if (user) {
        app.use((req, _res, next) => {
            req.user = user;
            next();
        });
    }
    app.use('/stolen-reports', stolen_1.default);
    app.use(errorHandler_1.errorHandler);
    return app;
}
const makeReport = (overrides = {}) => ({
    id: 'sr-001',
    plate: 'KCA123A',
    plateDisplay: 'KCA 123A',
    vin: null,
    reporterUserId: null,
    reporterType: 'owner',
    dateStolenIso: '2024-06-15',
    countyStolen: 'Nairobi',
    townStolen: 'Westlands',
    policeObNumber: null,
    policeStation: null,
    carColor: 'White',
    identifyingMarks: null,
    photoUrls: [],
    contactPhone: '0712345678',
    contactEmail: null,
    status: 'pending',
    isObVerified: false,
    adminNote: null,
    reviewedBy: null,
    reviewedAt: null,
    recoveryDate: null,
    recoveryCounty: null,
    recoveryNotes: null,
    createdAt: new Date().toISOString(),
    ...overrides,
});
(0, vitest_1.beforeEach)(() => vitest_1.vi.clearAllMocks());
// ---------------------------------------------------------------------------
// POST /stolen-reports
// ---------------------------------------------------------------------------
(0, vitest_1.describe)('POST /stolen-reports', () => {
    (0, vitest_1.it)('returns 201 on valid anonymous submission', async () => {
        vitest_1.vi.mocked(stolenValidator_js_1.validateStolenSubmission).mockReturnValue({ valid: true, errors: [] });
        vitest_1.vi.mocked(stolenReportService_js_1.submitReport).mockResolvedValue(makeReport());
        const res = await (0, supertest_1.default)(buildApp())
            .post('/stolen-reports')
            .send({
            plate: 'KCA123A',
            dateStolenIso: '2024-06-15',
            countyStolen: 'Nairobi',
            townStolen: 'Westlands',
            carColor: 'White',
            reporterType: 'owner',
            contactPhone: '0712345678',
        });
        (0, vitest_1.expect)(res.status).toBe(201);
        (0, vitest_1.expect)(res.body.report.id).toBe('sr-001');
        (0, vitest_1.expect)(res.body.message).toMatch(/received/i);
        (0, vitest_1.expect)(stolenReportService_js_1.submitReport).toHaveBeenCalledWith(vitest_1.expect.anything(), null);
    });
    (0, vitest_1.it)('passes user id when authenticated', async () => {
        vitest_1.vi.mocked(stolenValidator_js_1.validateStolenSubmission).mockReturnValue({ valid: true, errors: [] });
        vitest_1.vi.mocked(stolenReportService_js_1.submitReport).mockResolvedValue(makeReport());
        await (0, supertest_1.default)(buildApp({ id: 'user-xyz', role: 'user' }))
            .post('/stolen-reports')
            .send({ plate: 'KCA123A' });
        (0, vitest_1.expect)(stolenReportService_js_1.submitReport).toHaveBeenCalledWith(vitest_1.expect.anything(), 'user-xyz');
    });
    (0, vitest_1.it)('returns 400 on validation failure', async () => {
        vitest_1.vi.mocked(stolenValidator_js_1.validateStolenSubmission).mockReturnValue({
            valid: false,
            errors: ['plate is required', 'carColor is required'],
        });
        const res = await (0, supertest_1.default)(buildApp()).post('/stolen-reports').send({});
        (0, vitest_1.expect)(res.status).toBe(400);
        (0, vitest_1.expect)(res.body.details).toContain('plate is required');
        (0, vitest_1.expect)(stolenReportService_js_1.submitReport).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)('returns 409 on duplicate report', async () => {
        vitest_1.vi.mocked(stolenValidator_js_1.validateStolenSubmission).mockReturnValue({ valid: true, errors: [] });
        vitest_1.vi.mocked(stolenReportService_js_1.submitReport).mockRejectedValue(Object.assign(new Error('A report for this vehicle was recently submitted'), {
            status: 409,
        }));
        const res = await (0, supertest_1.default)(buildApp()).post('/stolen-reports').send({ plate: 'KCA123A' });
        (0, vitest_1.expect)(res.status).toBe(409);
    });
});
// ---------------------------------------------------------------------------
// GET /stolen-reports/plate/:plate  — FREE, no auth
// ---------------------------------------------------------------------------
(0, vitest_1.describe)('GET /stolen-reports/plate/:plate', () => {
    (0, vitest_1.it)('returns reports and hasActiveReport flag', async () => {
        vitest_1.vi.mocked(stolenReportService_js_1.getByPlate).mockResolvedValue([
            makeReport({ status: 'active' }),
        ]);
        const res = await (0, supertest_1.default)(buildApp()).get('/stolen-reports/plate/KCA123A');
        (0, vitest_1.expect)(res.status).toBe(200);
        (0, vitest_1.expect)(res.body.hasActiveReport).toBe(true);
        (0, vitest_1.expect)(res.body.reports).toHaveLength(1);
        (0, vitest_1.expect)(stolenReportService_js_1.getByPlate).toHaveBeenCalledWith('KCA123A');
    });
    (0, vitest_1.it)('returns hasActiveReport=false when no active reports', async () => {
        vitest_1.vi.mocked(stolenReportService_js_1.getByPlate).mockResolvedValue([
            makeReport({ status: 'rejected' }),
        ]);
        const res = await (0, supertest_1.default)(buildApp()).get('/stolen-reports/plate/KCA123A');
        (0, vitest_1.expect)(res.body.hasActiveReport).toBe(false);
    });
    (0, vitest_1.it)('returns empty result for unknown plate', async () => {
        vitest_1.vi.mocked(stolenReportService_js_1.getByPlate).mockResolvedValue([]);
        const res = await (0, supertest_1.default)(buildApp()).get('/stolen-reports/plate/UNKNOWN');
        (0, vitest_1.expect)(res.status).toBe(200);
        (0, vitest_1.expect)(res.body.hasActiveReport).toBe(false);
        (0, vitest_1.expect)(res.body.reports).toHaveLength(0);
    });
});
// ---------------------------------------------------------------------------
// GET /stolen-reports/vin/:vin
// ---------------------------------------------------------------------------
(0, vitest_1.describe)('GET /stolen-reports/vin/:vin', () => {
    (0, vitest_1.it)('returns reports by VIN', async () => {
        vitest_1.vi.mocked(stolenReportService_js_1.getByVin).mockResolvedValue([
            makeReport({ vin: 'JTDBR32E540012345', status: 'active' }),
        ]);
        const res = await (0, supertest_1.default)(buildApp()).get('/stolen-reports/vin/JTDBR32E540012345');
        (0, vitest_1.expect)(res.status).toBe(200);
        (0, vitest_1.expect)(res.body.hasActiveReport).toBe(true);
        (0, vitest_1.expect)(stolenReportService_js_1.getByVin).toHaveBeenCalledWith('JTDBR32E540012345');
    });
});
// ---------------------------------------------------------------------------
// GET /stolen-reports/:id
// ---------------------------------------------------------------------------
(0, vitest_1.describe)('GET /stolen-reports/:id', () => {
    (0, vitest_1.it)('hides contact info from anonymous users', async () => {
        vitest_1.vi.mocked(stolenReportService_js_1.getById).mockResolvedValue(makeReport({ contactPhone: '0712345678', contactEmail: 'owner@example.com' }));
        const res = await (0, supertest_1.default)(buildApp()).get('/stolen-reports/sr-001');
        (0, vitest_1.expect)(res.status).toBe(200);
        (0, vitest_1.expect)(res.body.report.contactPhone).toBeUndefined();
        (0, vitest_1.expect)(res.body.report.contactEmail).toBeUndefined();
    });
    (0, vitest_1.it)('shows contact info to the original reporter', async () => {
        vitest_1.vi.mocked(stolenReportService_js_1.getById).mockResolvedValue(makeReport({ reporterUserId: 'owner-id', contactPhone: '0712345678' }));
        const res = await (0, supertest_1.default)(buildApp({ id: 'owner-id', role: 'user' }))
            .get('/stolen-reports/sr-001');
        (0, vitest_1.expect)(res.status).toBe(200);
        (0, vitest_1.expect)(res.body.report.contactPhone).toBe('0712345678');
    });
    (0, vitest_1.it)('shows contact info to admin', async () => {
        vitest_1.vi.mocked(stolenReportService_js_1.getById).mockResolvedValue(makeReport({ contactPhone: '0712345678' }));
        const res = await (0, supertest_1.default)(buildApp({ id: 'admin-id', role: 'admin' }))
            .get('/stolen-reports/sr-001');
        (0, vitest_1.expect)(res.body.report.contactPhone).toBe('0712345678');
    });
    (0, vitest_1.it)('returns 404 for missing report', async () => {
        vitest_1.vi.mocked(stolenReportService_js_1.getById).mockResolvedValue(null);
        const res = await (0, supertest_1.default)(buildApp()).get('/stolen-reports/missing');
        (0, vitest_1.expect)(res.status).toBe(404);
    });
});
// ---------------------------------------------------------------------------
// PATCH /stolen-reports/:id/review  (admin only)
// ---------------------------------------------------------------------------
(0, vitest_1.describe)('PATCH /stolen-reports/:id/review', () => {
    (0, vitest_1.it)('returns 403 for non-admin', async () => {
        const res = await (0, supertest_1.default)(buildApp({ id: 'user-id', role: 'user' }))
            .patch('/stolen-reports/sr-001/review')
            .send({ status: 'active' });
        (0, vitest_1.expect)(res.status).toBe(403);
        (0, vitest_1.expect)(stolenReportService_js_1.reviewReport).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)('approves report as admin', async () => {
        vitest_1.vi.mocked(stolenReportService_js_1.reviewReport).mockResolvedValue(makeReport({ status: 'active', isObVerified: true }));
        const res = await (0, supertest_1.default)(buildApp({ id: 'admin-id', role: 'admin' }))
            .patch('/stolen-reports/sr-001/review')
            .send({ status: 'active', isObVerified: true });
        (0, vitest_1.expect)(res.status).toBe(200);
        (0, vitest_1.expect)(res.body.report.status).toBe('active');
        (0, vitest_1.expect)(stolenReportService_js_1.reviewReport).toHaveBeenCalledWith('sr-001', { status: 'active', adminNote: undefined, isObVerified: true }, 'admin-id');
    });
    (0, vitest_1.it)('rejects report as admin', async () => {
        vitest_1.vi.mocked(stolenReportService_js_1.reviewReport).mockResolvedValue(makeReport({ status: 'rejected', adminNote: 'Fake report' }));
        const res = await (0, supertest_1.default)(buildApp({ id: 'admin-id', role: 'admin' }))
            .patch('/stolen-reports/sr-001/review')
            .send({ status: 'rejected', adminNote: 'Fake report' });
        (0, vitest_1.expect)(res.status).toBe(200);
        (0, vitest_1.expect)(res.body.report.status).toBe('rejected');
    });
    (0, vitest_1.it)('returns 400 for invalid status value', async () => {
        const res = await (0, supertest_1.default)(buildApp({ id: 'admin-id', role: 'admin' }))
            .patch('/stolen-reports/sr-001/review')
            .send({ status: 'maybe' });
        (0, vitest_1.expect)(res.status).toBe(400);
        (0, vitest_1.expect)(stolenReportService_js_1.reviewReport).not.toHaveBeenCalled();
    });
});
// ---------------------------------------------------------------------------
// POST /stolen-reports/:id/recovered
// ---------------------------------------------------------------------------
(0, vitest_1.describe)('POST /stolen-reports/:id/recovered', () => {
    (0, vitest_1.it)('marks report recovered (anonymous — allowed for now, service enforces ownership)', async () => {
        vitest_1.vi.mocked(stolenValidator_js_1.validateRecoverySubmission).mockReturnValue({ valid: true, errors: [] });
        vitest_1.vi.mocked(stolenReportService_js_1.markRecovered).mockResolvedValue(makeReport({ status: 'recovered' }));
        const res = await (0, supertest_1.default)(buildApp())
            .post('/stolen-reports/sr-001/recovered')
            .send({ recoveryDate: '2024-07-01', recoveryCounty: 'Nairobi' });
        (0, vitest_1.expect)(res.status).toBe(200);
        (0, vitest_1.expect)(res.body.report.status).toBe('recovered');
        (0, vitest_1.expect)(res.body.message).toMatch(/recovered/i);
    });
    (0, vitest_1.it)('returns 400 on recovery validation failure', async () => {
        vitest_1.vi.mocked(stolenValidator_js_1.validateRecoverySubmission).mockReturnValue({
            valid: false,
            errors: ['recoveryDate is required'],
        });
        const res = await (0, supertest_1.default)(buildApp())
            .post('/stolen-reports/sr-001/recovered')
            .send({});
        (0, vitest_1.expect)(res.status).toBe(400);
        (0, vitest_1.expect)(stolenReportService_js_1.markRecovered).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)('returns 403 when service rejects unauthorized recovery', async () => {
        vitest_1.vi.mocked(stolenValidator_js_1.validateRecoverySubmission).mockReturnValue({ valid: true, errors: [] });
        vitest_1.vi.mocked(stolenReportService_js_1.markRecovered).mockRejectedValue(Object.assign(new Error('Unauthorized'), { status: 403 }));
        const res = await (0, supertest_1.default)(buildApp({ id: 'wrong-user', role: 'user' }))
            .post('/stolen-reports/sr-001/recovered')
            .send({ recoveryDate: '2024-07-01', recoveryCounty: 'Nairobi' });
        (0, vitest_1.expect)(res.status).toBe(403);
    });
});
