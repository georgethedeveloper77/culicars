"use strict";
// apps/api/src/__tests__/stolenReportService.test.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
vitest_1.vi.mock('../lib/prisma.js', () => ({
    default: {
        stolen_reports: {
            create: vitest_1.vi.fn(),
            findMany: vitest_1.vi.fn(),
            findFirst: vitest_1.vi.fn(),
            findUnique: vitest_1.vi.fn(),
            update: vitest_1.vi.fn(),
        },
        vehicles: {
            findUnique: vitest_1.vi.fn(),
            create: vitest_1.vi.fn(),
        },
        plate_vin_map: {
            findFirst: vitest_1.vi.fn(),
            upsert: vitest_1.vi.fn(),
        },
        vehicle_events: {
            create: vitest_1.vi.fn(),
        },
        reports: {
            updateMany: vitest_1.vi.fn(),
        },
    },
}));
const prisma_1 = __importDefault(require("../lib/prisma"));
const stolenReportService_js_1 = require("../services/stolenReportService.js");
const baseSubmission = {
    plate: 'KCA123A',
    dateStolenIso: '2024-06-15',
    countyStolen: 'Nairobi',
    townStolen: 'Westlands',
    carColor: 'White',
    reporterType: 'owner',
    contactPhone: '0712345678',
};
const makeReportRow = (overrides = {}) => ({
    id: 'report-001',
    plate: 'KCA123A',
    plate_display: 'KCA 123A',
    vin: null,
    reporter_user_id: null,
    reporter_type: 'owner',
    date_stolen: new Date('2024-06-15'),
    county_stolen: 'Nairobi',
    town_stolen: 'Westlands',
    police_ob_number: null,
    police_station: null,
    car_color: 'White',
    identifying_marks: null,
    photo_urls: [],
    contact_phone: '0712345678',
    contact_email: null,
    status: 'pending',
    is_ob_verified: false,
    admin_note: null,
    reviewed_by: null,
    reviewed_at: null,
    recovery_date: null,
    recovery_county: null,
    recovery_notes: null,
    created_at: new Date().toISOString(),
    ...overrides,
});
(0, vitest_1.beforeEach)(() => {
    vitest_1.vi.clearAllMocks();
});
// ---------------------------------------------------------------------------
// submitReport
// ---------------------------------------------------------------------------
(0, vitest_1.describe)('submitReport', () => {
    (0, vitest_1.it)('creates a pending report', async () => {
        vitest_1.vi.mocked(prisma_1.default.stolenReport.findFirst).mockResolvedValue(null);
        vitest_1.vi.mocked(prisma_1.default.stolenReport.create).mockResolvedValue(makeReportRow());
        const result = await (0, stolenReportService_js_1.submitReport)(baseSubmission, null);
        (0, vitest_1.expect)(prisma_1.default.stolenReport.create).toHaveBeenCalledOnce();
        const createArgs = vitest_1.vi.mocked(prisma_1.default.stolenReport.create).mock.calls[0][0];
        (0, vitest_1.expect)(createArgs.data['plate']).toBe('KCA123A'); // normalised
        (0, vitest_1.expect)(createArgs.data['status']).toBe('pending');
        (0, vitest_1.expect)(result.status).toBe('pending');
    });
    (0, vitest_1.it)('normalises plate by removing spaces and uppercasing', async () => {
        vitest_1.vi.mocked(prisma_1.default.stolenReport.findFirst).mockResolvedValue(null);
        vitest_1.vi.mocked(prisma_1.default.stolenReport.create).mockResolvedValue(makeReportRow());
        await (0, stolenReportService_js_1.submitReport)({ ...baseSubmission, plate: 'kca 123a' }, null);
        const createArgs = vitest_1.vi.mocked(prisma_1.default.stolenReport.create).mock.calls[0][0];
        (0, vitest_1.expect)(createArgs.data['plate']).toBe('KCA123A');
    });
    (0, vitest_1.it)('rejects duplicate report submitted within 24 hours', async () => {
        vitest_1.vi.mocked(prisma_1.default.stolenReport.findFirst).mockResolvedValue(makeReportRow());
        await (0, vitest_1.expect)((0, stolenReportService_js_1.submitReport)(baseSubmission, null)).rejects.toMatchObject({ status: 409 });
    });
    (0, vitest_1.it)('stores reporter user_id when authenticated', async () => {
        vitest_1.vi.mocked(prisma_1.default.stolenReport.findFirst).mockResolvedValue(null);
        vitest_1.vi.mocked(prisma_1.default.stolenReport.create).mockResolvedValue(makeReportRow());
        await (0, stolenReportService_js_1.submitReport)(baseSubmission, 'user-xyz');
        const createArgs = vitest_1.vi.mocked(prisma_1.default.stolenReport.create).mock.calls[0][0];
        (0, vitest_1.expect)(createArgs.data['reporter_user_id']).toBe('user-xyz');
    });
});
// ---------------------------------------------------------------------------
// getByPlate / getByVin
// ---------------------------------------------------------------------------
(0, vitest_1.describe)('getByPlate', () => {
    (0, vitest_1.it)('returns reports for a normalised plate', async () => {
        vitest_1.vi.mocked(prisma_1.default.stolenReport.findMany).mockResolvedValue([makeReportRow()]);
        const results = await (0, stolenReportService_js_1.getByPlate)('KCA 123A');
        (0, vitest_1.expect)(prisma_1.default.stolenReport.findMany).toHaveBeenCalledWith(vitest_1.expect.objectContaining({ where: { plate: 'KCA123A' } }));
        (0, vitest_1.expect)(results).toHaveLength(1);
    });
});
(0, vitest_1.describe)('getByVin', () => {
    (0, vitest_1.it)('returns reports for a VIN', async () => {
        vitest_1.vi.mocked(prisma_1.default.stolenReport.findMany).mockResolvedValue([
            makeReportRow({ vin: 'JTDBR32E540012345' }),
        ]);
        const results = await (0, stolenReportService_js_1.getByVin)('JTDBR32E540012345');
        (0, vitest_1.expect)(results[0].vin).toBe('JTDBR32E540012345');
    });
});
// ---------------------------------------------------------------------------
// reviewReport (admin approve)
// ---------------------------------------------------------------------------
(0, vitest_1.describe)('reviewReport', () => {
    (0, vitest_1.it)('approves report and creates STOLEN vehicle event when VIN known', async () => {
        const reportWithVin = makeReportRow({
            vin: 'JTDBR32E540012345',
            status: 'active',
        });
        vitest_1.vi.mocked(prisma_1.default.stolenReport.findUnique).mockResolvedValue(makeReportRow());
        vitest_1.vi.mocked(prisma_1.default.stolenReport.update).mockResolvedValue(reportWithVin);
        vitest_1.vi.mocked(prisma_1.default.vehicle.findUnique).mockResolvedValue({ vin: 'JTDBR32E540012345' });
        vitest_1.vi.mocked(prisma_1.default.vehicleEvent.create).mockResolvedValue({});
        vitest_1.vi.mocked(prisma_1.default.report.updateMany).mockResolvedValue({ count: 1 });
        const result = await (0, stolenReportService_js_1.reviewReport)('report-001', { status: 'active', isObVerified: true }, 'admin-id');
        (0, vitest_1.expect)(result.status).toBe('active');
        (0, vitest_1.expect)(prisma_1.default.vehicleEvent.create).toHaveBeenCalledOnce();
        const eventArgs = vitest_1.vi.mocked(prisma_1.default.vehicleEvent.create).mock.calls[0][0];
        (0, vitest_1.expect)(eventArgs.data['event_type']).toBe('STOLEN');
    });
    (0, vitest_1.it)('creates vehicle record if VIN is provided but vehicle not in DB', async () => {
        const reportWithVin = makeReportRow({
            vin: 'NEWVIN00000000001',
            status: 'active',
        });
        vitest_1.vi.mocked(prisma_1.default.stolenReport.findUnique).mockResolvedValue(makeReportRow());
        vitest_1.vi.mocked(prisma_1.default.stolenReport.update).mockResolvedValue(reportWithVin);
        vitest_1.vi.mocked(prisma_1.default.vehicle.findUnique).mockResolvedValue(null);
        vitest_1.vi.mocked(prisma_1.default.vehicle.create).mockResolvedValue({});
        vitest_1.vi.mocked(prisma_1.default.plateVinMap.upsert).mockResolvedValue({});
        vitest_1.vi.mocked(prisma_1.default.vehicleEvent.create).mockResolvedValue({});
        vitest_1.vi.mocked(prisma_1.default.report.updateMany).mockResolvedValue({ count: 0 });
        await (0, stolenReportService_js_1.reviewReport)('report-001', { status: 'active' }, 'admin-id');
        (0, vitest_1.expect)(prisma_1.default.vehicle.create).toHaveBeenCalledOnce();
    });
    (0, vitest_1.it)('marks existing reports as stale on approval', async () => {
        const reportWithVin = makeReportRow({ vin: 'JTDBR32E540012345', status: 'active' });
        vitest_1.vi.mocked(prisma_1.default.stolenReport.findUnique).mockResolvedValue(makeReportRow());
        vitest_1.vi.mocked(prisma_1.default.stolenReport.update).mockResolvedValue(reportWithVin);
        vitest_1.vi.mocked(prisma_1.default.vehicle.findUnique).mockResolvedValue({ vin: 'JTDBR32E540012345' });
        vitest_1.vi.mocked(prisma_1.default.vehicleEvent.create).mockResolvedValue({});
        vitest_1.vi.mocked(prisma_1.default.report.updateMany).mockResolvedValue({ count: 2 });
        await (0, stolenReportService_js_1.reviewReport)('report-001', { status: 'active' }, 'admin-id');
        (0, vitest_1.expect)(prisma_1.default.report.updateMany).toHaveBeenCalledWith(vitest_1.expect.objectContaining({ data: { status: 'stale' } }));
    });
    (0, vitest_1.it)('throws 404 for missing report', async () => {
        vitest_1.vi.mocked(prisma_1.default.stolenReport.findUnique).mockResolvedValue(null);
        await (0, vitest_1.expect)((0, stolenReportService_js_1.reviewReport)('no-such-id', { status: 'active' }, 'admin-id')).rejects.toMatchObject({ status: 404 });
    });
});
// ---------------------------------------------------------------------------
// markRecovered
// ---------------------------------------------------------------------------
(0, vitest_1.describe)('markRecovered', () => {
    (0, vitest_1.it)('marks an active report as recovered and adds RECOVERED event', async () => {
        vitest_1.vi.mocked(prisma_1.default.stolenReport.findUnique).mockResolvedValue(makeReportRow({ status: 'active', vin: 'JTDBR32E540012345' }));
        vitest_1.vi.mocked(prisma_1.default.stolenReport.update).mockResolvedValue(makeReportRow({ status: 'recovered', vin: 'JTDBR32E540012345' }));
        vitest_1.vi.mocked(prisma_1.default.vehicleEvent.create).mockResolvedValue({});
        vitest_1.vi.mocked(prisma_1.default.report.updateMany).mockResolvedValue({ count: 1 });
        const result = await (0, stolenReportService_js_1.markRecovered)('report-001', { recoveryDate: '2024-07-01', recoveryCounty: 'Nairobi' }, null);
        (0, vitest_1.expect)(result.status).toBe('recovered');
        (0, vitest_1.expect)(prisma_1.default.vehicleEvent.create).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
            data: vitest_1.expect.objectContaining({ event_type: 'RECOVERED' }),
        }));
    });
    (0, vitest_1.it)('rejects recovery on non-active report', async () => {
        vitest_1.vi.mocked(prisma_1.default.stolenReport.findUnique).mockResolvedValue(makeReportRow({ status: 'pending' }));
        await (0, vitest_1.expect)((0, stolenReportService_js_1.markRecovered)('report-001', { recoveryDate: '2024-07-01', recoveryCounty: 'Nairobi' }, null)).rejects.toMatchObject({ status: 400 });
    });
    (0, vitest_1.it)('throws 403 when a different user tries to mark recovered', async () => {
        vitest_1.vi.mocked(prisma_1.default.stolenReport.findUnique).mockResolvedValue(makeReportRow({ status: 'active', reporter_user_id: 'owner-id' }));
        await (0, vitest_1.expect)((0, stolenReportService_js_1.markRecovered)('report-001', { recoveryDate: '2024-07-01', recoveryCounty: 'Nairobi' }, 'other-user-id')).rejects.toMatchObject({ status: 403 });
    });
});
