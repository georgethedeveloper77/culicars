// apps/api/src/routes/__tests__/scraperRoute.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';

vi.mock('../../processors/rawDataProcessor', () => ({
  processVehicleQuery: vi.fn(),
}));

vi.mock('../../services/searchDemandQueueService', () => ({
  enqueue: vi.fn().mockResolvedValue(undefined),
}));

import scraperRouter from '../scraper';
import { processVehicleQuery } from '../../processors/rawDataProcessor';
import type { MergedVehicleRecord } from '../../types/result.types';

const app = express();
app.use(express.json());
app.use('/scraper', scraperRouter);

const mockMerged: MergedVehicleRecord = {
  vin: 'TESTVIN123', plate: 'KCA 123A',
  make: 'Toyota', model: 'Fielder', year: 2019,
  engineCapacity: '1500cc', fuel_type: 'Petrol', color: 'White',
  body_type: 'Station Wagon', transmissionType: 'Automatic',
  registrationDate: '2019-06-01', importDate: null,
  mileage: 45000, mileageUnit: 'km', auctionGrade: null,
  resultState: 'verified', confidence: 1.0,
  sources: ['ntsa_cor'], fieldSources: {},
};

describe('GET /scraper/result-states', () => {
  it('returns the four result state strings', async () => {
    const res = await request(app).get('/scraper/result-states');
    expect(res.status).toBe(200);
    expect(res.body.data).toContain('verified');
    expect(res.body.data).toContain('partial');
    expect(res.body.data).toContain('low_confidence');
    expect(res.body.data).toContain('pending_enrichment');
  });
});

describe('POST /scraper/process', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 400 when neither vin nor plate provided', async () => {
    const res = await request(app).post('/scraper/process').send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns merged vehicle data on success', async () => {
    vi.mocked(processVehicleQuery).mockResolvedValueOnce({
      merged: mockMerged, records: [{}] as never, shouldQueue: false,
    });

    const res = await request(app).post('/scraper/process').send({ vin: 'TESTVIN123' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.resultState).toBe('verified');
    expect(res.body.data.vehicle.make).toBe('Toyota');
    expect(res.body.data.queued).toBe(false);
  });

  it('returns a shell (not empty) for pending_enrichment', async () => {
    const emptyMerged: MergedVehicleRecord = {
      vin: null, plate: 'KCA 999Z', make: null, model: null, year: null,
      engineCapacity: null, fuel_type: null, color: null, body_type: null,
      transmissionType: null, registrationDate: null, importDate: null,
      mileage: null, mileageUnit: null, auctionGrade: null,
      resultState: 'pending_enrichment', confidence: 0,
      sources: [], fieldSources: {},
    };
    vi.mocked(processVehicleQuery).mockResolvedValueOnce({
      merged: emptyMerged, records: [], shouldQueue: true,
    });

    const res = await request(app).post('/scraper/process').send({ plate: 'KCA 999Z' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.resultState).toBe('pending_enrichment');
    expect(res.body.data.queued).toBe(true);
  });

  it('returns 500 when processor throws', async () => {
    vi.mocked(processVehicleQuery).mockRejectedValueOnce(new Error('Exploded'));

    const res = await request(app).post('/scraper/process').send({ vin: 'BADVIN' });

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});
