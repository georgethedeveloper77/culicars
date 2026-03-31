// apps/api/src/processors/__tests__/rawDataProcessor.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processVehicleQuery } from '../rawDataProcessor';
import type { NormalisedRecord } from '../../types/result.types';

vi.mock('../../services/scrapers/adapterRegistry', () => ({
  getEnabledAdapters: vi.fn(),
}));

import { getEnabledAdapters } from '../../services/scrapers/adapterRegistry';

const makeRecord = (sourceName: string, confidence: number, overrides: Partial<NormalisedRecord> = {}): NormalisedRecord => ({
  vin: 'TESTVIN123',
  plate: 'KCA 123A',
  make: 'Toyota',
  model: 'Fielder',
  year: 2019,
  engineCapacity: '1500cc',
  fuel_type: 'Petrol',
  color: 'White',
  body_type: 'Station Wagon',
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

const makeAdapter = (sourceName: string, confidence: number, overrides: Partial<NormalisedRecord> = {}) => ({
  sourceName,
  isEnabled: () => true,
  fetchByVin:   vi.fn().mockResolvedValue(makeRecord(sourceName, confidence, overrides)),
  fetchByPlate: vi.fn().mockResolvedValue(null),
});

const nullAdapter = (sourceName: string) => ({
  sourceName,
  is_enabled:    () => true,
  isEnabled:     () => true,
  fetchByVin:   vi.fn().mockResolvedValue(null),
  fetchByPlate: vi.fn().mockResolvedValue(null),
});

describe('rawDataProcessor', () => {
  beforeEach(() => vi.clearAllMocks());

  it('throws if neither vin nor plate is provided', async () => {
    await expect(processVehicleQuery({})).rejects.toThrow();
  });

  it('returns pending_enrichment shell when all adapters return null', async () => {
    vi.mocked(getEnabledAdapters).mockReturnValue([nullAdapter('ntsa_cor'), nullAdapter('be_forward')]);

    const result = await processVehicleQuery({ vin: 'UNKNOWN123' });

    expect(result.merged.resultState).toBe('pending_enrichment');
    expect(result.records).toHaveLength(0);
    expect(result.shouldQueue).toBe(true);
    expect(result.merged).toBeDefined();
  });

  it('returns verified when high-confidence adapter returns full identity', async () => {
    vi.mocked(getEnabledAdapters).mockReturnValue([makeAdapter('ntsa_cor', 1.0)]);

    const result = await processVehicleQuery({ vin: 'TESTVIN123' });

    expect(result.merged.resultState).toBe('verified');
    expect(result.merged.make).toBe('Toyota');
    expect(result.merged.model).toBe('Fielder');
    expect(result.merged.year).toBe(2019);
    expect(result.shouldQueue).toBe(false);
  });

  it('returns partial when identity present but confidence < 0.85', async () => {
    vi.mocked(getEnabledAdapters).mockReturnValue([makeAdapter('low_source', 0.5)]);

    const result = await processVehicleQuery({ vin: 'TESTVIN123' });

    expect(result.merged.resultState).toBe('partial');
    expect(result.shouldQueue).toBe(false);
  });

  it('returns low_confidence when data exists but identity is incomplete', async () => {
    vi.mocked(getEnabledAdapters).mockReturnValue([
      makeAdapter('ntsa_cor', 1.0, { make: null, model: null, year: null }),
    ]);

    const result = await processVehicleQuery({ vin: 'TESTVIN123' });

    expect(result.merged.resultState).toBe('low_confidence');
    expect(result.shouldQueue).toBe(true);
  });

  it('higher-confidence source wins field conflict', async () => {
    vi.mocked(getEnabledAdapters).mockReturnValue([
      makeAdapter('sbt_japan', 0.80, { color: 'Black' }),
      makeAdapter('ntsa_cor',  1.0,  { color: 'White' }),
    ]);

    const result = await processVehicleQuery({ vin: 'TESTVIN123' });

    expect(result.merged.color).toBe('White');
    expect(result.merged.fieldSources['color']).toBe('ntsa_cor');
  });

  it('be_forward auctionGrade always wins regardless of order', async () => {
    vi.mocked(getEnabledAdapters).mockReturnValue([
      makeAdapter('ntsa_cor',   1.0,  { auctionGrade: 'B' }),
      makeAdapter('be_forward', 0.85, { auctionGrade: '4.5' }),
    ]);

    const result = await processVehicleQuery({ vin: 'TESTVIN123' });

    expect(result.merged.auctionGrade).toBe('4.5');
    expect(result.merged.fieldSources['auctionGrade']).toBe('be_forward');
  });

  it('merges fields from multiple adapters', async () => {
    vi.mocked(getEnabledAdapters).mockReturnValue([
      makeAdapter('be_forward', 0.85, { importDate: '2019-03-15', auctionGrade: '4' }),
      makeAdapter('ntsa_cor',   1.0,  { registrationDate: '2019-06-01' }),
    ]);

    const result = await processVehicleQuery({ vin: 'TESTVIN123' });

    expect(result.merged.importDate).toBe('2019-03-15');
    expect(result.merged.registrationDate).toBe('2019-06-01');
    expect(result.merged.sources).toContain('be_forward');
    expect(result.merged.sources).toContain('ntsa_cor');
    expect(result.records).toHaveLength(2);
  });

  it('does not throw when an adapter throws unexpectedly', async () => {
    const badAdapter = {
      sourceName:   'bad_source',
      is_enabled:    () => true,
      isEnabled:     () => true,
      fetchByVin:   vi.fn().mockRejectedValue(new Error('Network error')),
      fetchByPlate: vi.fn().mockResolvedValue(null),
    };
    vi.mocked(getEnabledAdapters).mockReturnValue([badAdapter, makeAdapter('ntsa_cor', 1.0)]);

    const result = await processVehicleQuery({ vin: 'TESTVIN123' });

    expect(result.merged.resultState).toBe('verified');
    expect(result.records).toHaveLength(1);
  });

  it('falls back to plate query when VIN returns null', async () => {
    const adapter = {
      sourceName:   'ntsa_cor',
      is_enabled:    () => true,
      isEnabled:     () => true,
      fetchByVin:   vi.fn().mockResolvedValue(null),
      fetchByPlate: vi.fn().mockResolvedValue(makeRecord('ntsa_cor', 1.0, { vin: null, plate: 'KCA 123A' })),
    };
    vi.mocked(getEnabledAdapters).mockReturnValue([adapter]);

    const result = await processVehicleQuery({ vin: 'UNKNOWN', plate: 'KCA 123A' });

    expect(result.merged.plate).toBe('KCA 123A');
    expect(result.merged.make).toBe('Toyota');
    expect(adapter.fetchByPlate).toHaveBeenCalledWith('KCA 123A');
  });
});
