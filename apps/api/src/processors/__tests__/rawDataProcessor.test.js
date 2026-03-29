"use strict";
// apps/api/src/processors/__tests__/rawDataProcessor.test.ts
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const rawDataProcessor_1 = require("../rawDataProcessor");
vitest_1.vi.mock('../../services/scrapers/adapterRegistry', () => ({
    getEnabledAdapters: vitest_1.vi.fn(),
}));
const adapterRegistry_1 = require("../../services/scrapers/adapterRegistry");
const makeRecord = (sourceName, confidence, overrides = {}) => ({
    vin: 'TESTVIN123',
    plate: 'KCA 123A',
    make: 'Toyota',
    model: 'Fielder',
    year: 2019,
    engineCapacity: '1500cc',
    fuelType: 'Petrol',
    color: 'White',
    bodyType: 'Station Wagon',
    transmissionType: 'Automatic',
    registrationDate: '2019-06-01',
    importDate: null,
    mileage: 45000,
    mileageUnit: 'km',
    auctionGrade: null,
    sourceId: 'src-001',
    sourceName,
    confidence,
    fetchedAt: new Date().toISOString(),
    ...overrides,
});
const makeAdapter = (sourceName, confidence, overrides = {}) => ({
    sourceName,
    isEnabled: () => true,
    fetchByVin: vitest_1.vi.fn().mockResolvedValue(makeRecord(sourceName, confidence, overrides)),
    fetchByPlate: vitest_1.vi.fn().mockResolvedValue(null),
});
const nullAdapter = (sourceName) => ({
    sourceName,
    isEnabled: () => true,
    fetchByVin: vitest_1.vi.fn().mockResolvedValue(null),
    fetchByPlate: vitest_1.vi.fn().mockResolvedValue(null),
});
(0, vitest_1.describe)('rawDataProcessor', () => {
    (0, vitest_1.beforeEach)(() => vitest_1.vi.clearAllMocks());
    (0, vitest_1.it)('throws if neither vin nor plate is provided', async () => {
        await (0, vitest_1.expect)((0, rawDataProcessor_1.processVehicleQuery)({})).rejects.toThrow();
    });
    (0, vitest_1.it)('returns pending_enrichment shell when all adapters return null', async () => {
        vitest_1.vi.mocked(adapterRegistry_1.getEnabledAdapters).mockReturnValue([nullAdapter('ntsa_cor'), nullAdapter('be_forward')]);
        const result = await (0, rawDataProcessor_1.processVehicleQuery)({ vin: 'UNKNOWN123' });
        (0, vitest_1.expect)(result.merged.resultState).toBe('pending_enrichment');
        (0, vitest_1.expect)(result.records).toHaveLength(0);
        (0, vitest_1.expect)(result.shouldQueue).toBe(true);
        (0, vitest_1.expect)(result.merged).toBeDefined();
    });
    (0, vitest_1.it)('returns verified when high-confidence adapter returns full identity', async () => {
        vitest_1.vi.mocked(adapterRegistry_1.getEnabledAdapters).mockReturnValue([makeAdapter('ntsa_cor', 1.0)]);
        const result = await (0, rawDataProcessor_1.processVehicleQuery)({ vin: 'TESTVIN123' });
        (0, vitest_1.expect)(result.merged.resultState).toBe('verified');
        (0, vitest_1.expect)(result.merged.make).toBe('Toyota');
        (0, vitest_1.expect)(result.merged.model).toBe('Fielder');
        (0, vitest_1.expect)(result.merged.year).toBe(2019);
        (0, vitest_1.expect)(result.shouldQueue).toBe(false);
    });
    (0, vitest_1.it)('returns partial when identity present but confidence < 0.85', async () => {
        vitest_1.vi.mocked(adapterRegistry_1.getEnabledAdapters).mockReturnValue([makeAdapter('low_source', 0.5)]);
        const result = await (0, rawDataProcessor_1.processVehicleQuery)({ vin: 'TESTVIN123' });
        (0, vitest_1.expect)(result.merged.resultState).toBe('partial');
        (0, vitest_1.expect)(result.shouldQueue).toBe(false);
    });
    (0, vitest_1.it)('returns low_confidence when data exists but identity is incomplete', async () => {
        vitest_1.vi.mocked(adapterRegistry_1.getEnabledAdapters).mockReturnValue([
            makeAdapter('ntsa_cor', 1.0, { make: null, model: null, year: null }),
        ]);
        const result = await (0, rawDataProcessor_1.processVehicleQuery)({ vin: 'TESTVIN123' });
        (0, vitest_1.expect)(result.merged.resultState).toBe('low_confidence');
        (0, vitest_1.expect)(result.shouldQueue).toBe(true);
    });
    (0, vitest_1.it)('higher-confidence source wins field conflict', async () => {
        vitest_1.vi.mocked(adapterRegistry_1.getEnabledAdapters).mockReturnValue([
            makeAdapter('sbt_japan', 0.80, { color: 'Black' }),
            makeAdapter('ntsa_cor', 1.0, { color: 'White' }),
        ]);
        const result = await (0, rawDataProcessor_1.processVehicleQuery)({ vin: 'TESTVIN123' });
        (0, vitest_1.expect)(result.merged.color).toBe('White');
        (0, vitest_1.expect)(result.merged.fieldSources['color']).toBe('ntsa_cor');
    });
    (0, vitest_1.it)('be_forward auctionGrade always wins regardless of order', async () => {
        vitest_1.vi.mocked(adapterRegistry_1.getEnabledAdapters).mockReturnValue([
            makeAdapter('ntsa_cor', 1.0, { auctionGrade: 'B' }),
            makeAdapter('be_forward', 0.85, { auctionGrade: '4.5' }),
        ]);
        const result = await (0, rawDataProcessor_1.processVehicleQuery)({ vin: 'TESTVIN123' });
        (0, vitest_1.expect)(result.merged.auctionGrade).toBe('4.5');
        (0, vitest_1.expect)(result.merged.fieldSources['auctionGrade']).toBe('be_forward');
    });
    (0, vitest_1.it)('merges fields from multiple adapters', async () => {
        vitest_1.vi.mocked(adapterRegistry_1.getEnabledAdapters).mockReturnValue([
            makeAdapter('be_forward', 0.85, { importDate: '2019-03-15', auctionGrade: '4' }),
            makeAdapter('ntsa_cor', 1.0, { registrationDate: '2019-06-01' }),
        ]);
        const result = await (0, rawDataProcessor_1.processVehicleQuery)({ vin: 'TESTVIN123' });
        (0, vitest_1.expect)(result.merged.importDate).toBe('2019-03-15');
        (0, vitest_1.expect)(result.merged.registrationDate).toBe('2019-06-01');
        (0, vitest_1.expect)(result.merged.sources).toContain('be_forward');
        (0, vitest_1.expect)(result.merged.sources).toContain('ntsa_cor');
        (0, vitest_1.expect)(result.records).toHaveLength(2);
    });
    (0, vitest_1.it)('does not throw when an adapter throws unexpectedly', async () => {
        const badAdapter = {
            sourceName: 'bad_source',
            isEnabled: () => true,
            fetchByVin: vitest_1.vi.fn().mockRejectedValue(new Error('Network error')),
            fetchByPlate: vitest_1.vi.fn().mockResolvedValue(null),
        };
        vitest_1.vi.mocked(adapterRegistry_1.getEnabledAdapters).mockReturnValue([badAdapter, makeAdapter('ntsa_cor', 1.0)]);
        const result = await (0, rawDataProcessor_1.processVehicleQuery)({ vin: 'TESTVIN123' });
        (0, vitest_1.expect)(result.merged.resultState).toBe('verified');
        (0, vitest_1.expect)(result.records).toHaveLength(1);
    });
    (0, vitest_1.it)('falls back to plate query when VIN returns null', async () => {
        const adapter = {
            sourceName: 'ntsa_cor',
            isEnabled: () => true,
            fetchByVin: vitest_1.vi.fn().mockResolvedValue(null),
            fetchByPlate: vitest_1.vi.fn().mockResolvedValue(makeRecord('ntsa_cor', 1.0, { vin: null, plate: 'KCA 123A' })),
        };
        vitest_1.vi.mocked(adapterRegistry_1.getEnabledAdapters).mockReturnValue([adapter]);
        const result = await (0, rawDataProcessor_1.processVehicleQuery)({ vin: 'UNKNOWN', plate: 'KCA 123A' });
        (0, vitest_1.expect)(result.merged.plate).toBe('KCA 123A');
        (0, vitest_1.expect)(result.merged.make).toBe('Toyota');
        (0, vitest_1.expect)(adapter.fetchByPlate).toHaveBeenCalledWith('KCA 123A');
    });
});
