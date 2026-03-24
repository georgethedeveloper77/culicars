"use strict";
// apps/api/src/__tests__/contributionService.test.ts
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
// Mock prisma before importing the service
vitest_1.vi.mock('../lib/prisma.js', () => ({
    default: {
        vehicles: {
            findUnique: vitest_1.vi.fn(),
        },
        contributions: {
            create: vitest_1.vi.fn(),
            findMany: vitest_1.vi.fn(),
            findUnique: vitest_1.vi.fn(),
            update: vitest_1.vi.fn(),
        },
        reports: {
            updateMany: vitest_1.vi.fn(),
        },
        vehicle_events: {
            create: vitest_1.vi.fn(),
        },
    },
}));
// Mock enrichmentService so approval side-effects don't run
vitest_1.vi.mock('../services/enrichmentService.js', () => ({
    applyContribution: vitest_1.vi.fn().mockResolvedValue(undefined),
}));
const prisma_1 = __importDefault(require("../lib/prisma"));
const contributionService_js_1 = require("../services/contributionService.js");
const mockVehicle = { vin: 'JTDBR32E540012345', make: 'Toyota', model: 'Fielder' };
const makeContribRow = (overrides = {}) => ({
    id: 'contrib-001',
    vin: 'JTDBR32E540012345',
    user_id: null,
    type: 'SERVICE_RECORD',
    title: 'Oil change at Nairobi Garage',
    description: null,
    data: {},
    evidence_urls: [],
    verification_doc_urls: [],
    status: 'pending',
    admin_note: null,
    reviewed_by: null,
    reviewed_at: null,
    confidence_score: 0.42,
    created_at: new Date().toISOString(),
    ...overrides,
});
(0, vitest_1.beforeEach)(() => {
    vitest_1.vi.clearAllMocks();
});
(0, vitest_1.describe)('submitContribution', () => {
    (0, vitest_1.it)('creates a contribution for a known vehicle', async () => {
        vitest_1.vi.mocked(prisma_1.default.vehicle.findUnique).mockResolvedValue(mockVehicle);
        vitest_1.vi.mocked(prisma_1.default.contribution.create).mockResolvedValue(makeContribRow());
        const result = await (0, contributionService_js_1.submitContribution)({
            vin: 'JTDBR32E540012345',
            type: 'SERVICE_RECORD',
            title: 'Oil change at Nairobi Garage',
            evidenceUrls: ['https://example.com/photo.jpg'],
        }, null);
        (0, vitest_1.expect)(prisma_1.default.contribution.create).toHaveBeenCalledOnce();
        (0, vitest_1.expect)(result.type).toBe('SERVICE_RECORD');
        (0, vitest_1.expect)(result.status).toBe('pending');
    });
    (0, vitest_1.it)('throws 404 when vehicle not found', async () => {
        vitest_1.vi.mocked(prisma_1.default.vehicle.findUnique).mockResolvedValue(null);
        await (0, vitest_1.expect)((0, contributionService_js_1.submitContribution)({
            vin: 'JTDBR32E540099999',
            type: 'SERVICE_RECORD',
            title: 'Test',
        }, null)).rejects.toMatchObject({ status: 404 });
    });
    (0, vitest_1.it)('sets higher confidence when user is authenticated with evidence', async () => {
        vitest_1.vi.mocked(prisma_1.default.vehicle.findUnique).mockResolvedValue(mockVehicle);
        let capturedData = {};
        vitest_1.vi.mocked(prisma_1.default.contribution.create).mockImplementation(async (args) => {
            capturedData = args.data;
            return makeContribRow({ confidence_score: capturedData['confidence_score'] });
        });
        await (0, contributionService_js_1.submitContribution)({
            vin: 'JTDBR32E540012345',
            type: 'SERVICE_RECORD',
            title: 'Timing belt replacement',
            evidenceUrls: ['photo.jpg'],
            verificationDocUrls: ['receipt.pdf'],
        }, 'user-abc');
        // Auth + photos + docs → higher than bare minimum
        (0, vitest_1.expect)(Number(capturedData['confidence_score'])).toBeGreaterThan(0.42);
        (0, vitest_1.expect)(Number(capturedData['confidence_score'])).toBeLessThanOrEqual(0.65);
    });
});
(0, vitest_1.describe)('getContributionsByVin', () => {
    (0, vitest_1.it)('returns only approved contributions for non-admin', async () => {
        vitest_1.vi.mocked(prisma_1.default.contribution.findMany).mockResolvedValue([
            makeContribRow({ status: 'approved' }),
        ]);
        const result = await (0, contributionService_js_1.getContributionsByVin)('JTDBR32E540012345', false);
        (0, vitest_1.expect)(prisma_1.default.contribution.findMany).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
            where: vitest_1.expect.objectContaining({ status: 'approved' }),
        }));
        (0, vitest_1.expect)(result).toHaveLength(1);
    });
    (0, vitest_1.it)('returns all contributions for admin', async () => {
        vitest_1.vi.mocked(prisma_1.default.contribution.findMany).mockResolvedValue([
            makeContribRow({ status: 'pending' }),
            makeContribRow({ id: 'c2', status: 'approved' }),
        ]);
        const result = await (0, contributionService_js_1.getContributionsByVin)('JTDBR32E540012345', true);
        // Where clause should not include status filter
        (0, vitest_1.expect)(prisma_1.default.contribution.findMany).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
            where: { vin: 'JTDBR32E540012345' },
        }));
        (0, vitest_1.expect)(result).toHaveLength(2);
    });
});
(0, vitest_1.describe)('moderateContribution', () => {
    (0, vitest_1.it)('approves contribution and triggers enrichment', async () => {
        const { applyContribution } = await Promise.resolve().then(() => __importStar(require('../services/enrichmentService.js')));
        vitest_1.vi.mocked(prisma_1.default.contribution.findUnique).mockResolvedValue(makeContribRow());
        vitest_1.vi.mocked(prisma_1.default.contribution.update).mockResolvedValue(makeContribRow({ status: 'approved' }));
        vitest_1.vi.mocked(prisma_1.default.report.updateMany).mockResolvedValue({ count: 0 });
        vitest_1.vi.mocked(prisma_1.default.vehicleEvent.create).mockResolvedValue({});
        const result = await (0, contributionService_js_1.moderateContribution)('contrib-001', { status: 'approved' }, 'admin-user-id');
        (0, vitest_1.expect)(result.status).toBe('approved');
        (0, vitest_1.expect)(applyContribution).toHaveBeenCalledOnce();
    });
    (0, vitest_1.it)('rejects contribution without triggering enrichment', async () => {
        const { applyContribution } = await Promise.resolve().then(() => __importStar(require('../services/enrichmentService.js')));
        vitest_1.vi.mocked(prisma_1.default.contribution.findUnique).mockResolvedValue(makeContribRow());
        vitest_1.vi.mocked(prisma_1.default.contribution.update).mockResolvedValue(makeContribRow({ status: 'rejected' }));
        const result = await (0, contributionService_js_1.moderateContribution)('contrib-001', { status: 'rejected', adminNote: 'Insufficient evidence' }, 'admin-user-id');
        (0, vitest_1.expect)(result.status).toBe('rejected');
        (0, vitest_1.expect)(applyContribution).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)('throws 404 when contribution not found', async () => {
        vitest_1.vi.mocked(prisma_1.default.contribution.findUnique).mockResolvedValue(null);
        await (0, vitest_1.expect)((0, contributionService_js_1.moderateContribution)('missing-id', { status: 'approved' }, 'admin-id')).rejects.toMatchObject({ status: 404 });
    });
});
