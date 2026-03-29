"use strict";
// apps/api/src/routes/__tests__/scraperRoute.test.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
vitest_1.vi.mock('../../processors/rawDataProcessor', () => ({
    processVehicleQuery: vitest_1.vi.fn(),
}));
vitest_1.vi.mock('../../services/searchDemandQueueService', () => ({
    enqueue: vitest_1.vi.fn().mockResolvedValue(undefined),
}));
const scraper_1 = __importDefault(require("../scraper"));
const rawDataProcessor_1 = require("../../processors/rawDataProcessor");
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use('/scraper', scraper_1.default);
const mockMerged = {
    vin: 'TESTVIN123', plate: 'KCA 123A',
    make: 'Toyota', model: 'Fielder', year: 2019,
    engineCapacity: '1500cc', fuelType: 'Petrol', color: 'White',
    bodyType: 'Station Wagon', transmissionType: 'Automatic',
    registrationDate: '2019-06-01', importDate: null,
    mileage: 45000, mileageUnit: 'km', auctionGrade: null,
    resultState: 'verified', confidence: 1.0,
    sources: ['ntsa_cor'], fieldSources: {},
};
(0, vitest_1.describe)('GET /scraper/result-states', () => {
    (0, vitest_1.it)('returns the four result state strings', async () => {
        const res = await (0, supertest_1.default)(app).get('/scraper/result-states');
        (0, vitest_1.expect)(res.status).toBe(200);
        (0, vitest_1.expect)(res.body.data).toContain('verified');
        (0, vitest_1.expect)(res.body.data).toContain('partial');
        (0, vitest_1.expect)(res.body.data).toContain('low_confidence');
        (0, vitest_1.expect)(res.body.data).toContain('pending_enrichment');
    });
});
(0, vitest_1.describe)('POST /scraper/process', () => {
    (0, vitest_1.beforeEach)(() => vitest_1.vi.clearAllMocks());
    (0, vitest_1.it)('returns 400 when neither vin nor plate provided', async () => {
        const res = await (0, supertest_1.default)(app).post('/scraper/process').send({});
        (0, vitest_1.expect)(res.status).toBe(400);
        (0, vitest_1.expect)(res.body.success).toBe(false);
    });
    (0, vitest_1.it)('returns merged vehicle data on success', async () => {
        vitest_1.vi.mocked(rawDataProcessor_1.processVehicleQuery).mockResolvedValueOnce({
            merged: mockMerged, records: [{}], shouldQueue: false,
        });
        const res = await (0, supertest_1.default)(app).post('/scraper/process').send({ vin: 'TESTVIN123' });
        (0, vitest_1.expect)(res.status).toBe(200);
        (0, vitest_1.expect)(res.body.success).toBe(true);
        (0, vitest_1.expect)(res.body.data.resultState).toBe('verified');
        (0, vitest_1.expect)(res.body.data.vehicle.make).toBe('Toyota');
        (0, vitest_1.expect)(res.body.data.queued).toBe(false);
    });
    (0, vitest_1.it)('returns a shell (not empty) for pending_enrichment', async () => {
        const emptyMerged = {
            vin: null, plate: 'KCA 999Z', make: null, model: null, year: null,
            engineCapacity: null, fuelType: null, color: null, bodyType: null,
            transmissionType: null, registrationDate: null, importDate: null,
            mileage: null, mileageUnit: null, auctionGrade: null,
            resultState: 'pending_enrichment', confidence: 0,
            sources: [], fieldSources: {},
        };
        vitest_1.vi.mocked(rawDataProcessor_1.processVehicleQuery).mockResolvedValueOnce({
            merged: emptyMerged, records: [], shouldQueue: true,
        });
        const res = await (0, supertest_1.default)(app).post('/scraper/process').send({ plate: 'KCA 999Z' });
        (0, vitest_1.expect)(res.status).toBe(200);
        (0, vitest_1.expect)(res.body.success).toBe(true);
        (0, vitest_1.expect)(res.body.data).toBeDefined();
        (0, vitest_1.expect)(res.body.data.resultState).toBe('pending_enrichment');
        (0, vitest_1.expect)(res.body.data.queued).toBe(true);
    });
    (0, vitest_1.it)('returns 500 when processor throws', async () => {
        vitest_1.vi.mocked(rawDataProcessor_1.processVehicleQuery).mockRejectedValueOnce(new Error('Exploded'));
        const res = await (0, supertest_1.default)(app).post('/scraper/process').send({ vin: 'BADVIN' });
        (0, vitest_1.expect)(res.status).toBe(500);
        (0, vitest_1.expect)(res.body.success).toBe(false);
    });
});
