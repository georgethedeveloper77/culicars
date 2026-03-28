// apps/api/src/__tests__/contributionService.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock prisma before importing the service
vi.mock('../lib/prisma', () => ({
  default: {
    vehicle: {
      findUnique: vi.fn(),
    },
    contribution: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    report: {
      updateMany: vi.fn(),
    },
    vehicleEvent: {
      create: vi.fn(),
    },
  },
}));

// Mock enrichmentService so approval side-effects don't run
vi.mock('../services/enrichmentService.js', () => ({
  applyContribution: vi.fn().mockResolvedValue(undefined),
}));

import prisma from '../lib/prisma';
import {
  submitContribution,
  getContributionsByVin,
  moderateContribution,
} from '../services/contributionService.js';

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

beforeEach(() => {
  vi.clearAllMocks();
});

describe('submitContribution', () => {
  it('creates a contribution for a known vehicle', async () => {
    vi.mocked(prisma.vehicle.findUnique).mockResolvedValue(mockVehicle as never);
    vi.mocked(prisma.contribution.create).mockResolvedValue(makeContribRow() as never);

    const result = await submitContribution(
      {
        vin: 'JTDBR32E540012345',
        type: 'SERVICE_RECORD',
        title: 'Oil change at Nairobi Garage',
        evidenceUrls: ['https://example.com/photo.jpg'],
      },
      null,
    );

    expect(prisma.contribution.create).toHaveBeenCalledOnce();
    expect(result.type).toBe('SERVICE_RECORD');
    expect(result.status).toBe('pending');
  });

  it('throws 404 when vehicle not found', async () => {
    vi.mocked(prisma.vehicle.findUnique).mockResolvedValue(null);

    await expect(
      submitContribution(
        {
          vin: 'JTDBR32E540099999',
          type: 'SERVICE_RECORD',
          title: 'Test',
        },
        null,
      ),
    ).rejects.toMatchObject({ status: 404 });
  });

  it('sets higher confidence when user is authenticated with evidence', async () => {
    vi.mocked(prisma.vehicle.findUnique).mockResolvedValue(mockVehicle as never);

    let capturedData: Record<string, unknown> = {};
    vi.mocked(prisma.contribution.create).mockImplementation(async (args: never) => {
      capturedData = (args as { data: Record<string, unknown> }).data;
      return makeContribRow({ confidence_score: capturedData['confidence_score'] }) as never;
    });

    await submitContribution(
      {
        vin: 'JTDBR32E540012345',
        type: 'SERVICE_RECORD',
        title: 'Timing belt replacement',
        evidenceUrls: ['photo.jpg'],
        verificationDocUrls: ['receipt.pdf'],
      },
      'user-abc',
    );

    // Auth + photos + docs → higher than bare minimum
    expect(Number(capturedData['confidence_score'])).toBeGreaterThan(0.42);
    expect(Number(capturedData['confidence_score'])).toBeLessThanOrEqual(0.65);
  });
});

describe('getContributionsByVin', () => {
  it('returns only approved contributions for non-admin', async () => {
    vi.mocked(prisma.contribution.findMany).mockResolvedValue([
      makeContribRow({ status: 'approved' }),
    ] as never);

    const result = await getContributionsByVin('JTDBR32E540012345', false);

    expect(prisma.contribution.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: 'approved' }),
      }),
    );
    expect(result).toHaveLength(1);
  });

  it('returns all contributions for admin', async () => {
    vi.mocked(prisma.contribution.findMany).mockResolvedValue([
      makeContribRow({ status: 'pending' }),
      makeContribRow({ id: 'c2', status: 'approved' }),
    ] as never);

    const result = await getContributionsByVin('JTDBR32E540012345', true);

    // Where clause should not include status filter
    expect(prisma.contribution.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { vin: 'JTDBR32E540012345' },
      }),
    );
    expect(result).toHaveLength(2);
  });
});

describe('moderateContribution', () => {
  it('approves contribution and triggers enrichment', async () => {
    const { applyContribution } = await import('../services/enrichmentService.js');

    vi.mocked(prisma.contribution.findUnique).mockResolvedValue(makeContribRow() as never);
    vi.mocked(prisma.contribution.update).mockResolvedValue(
      makeContribRow({ status: 'approved' }) as never,
    );
    vi.mocked(prisma.report.updateMany).mockResolvedValue({ count: 0 } as never);
    vi.mocked(prisma.vehicleEvent.create).mockResolvedValue({} as never);

    const result = await moderateContribution(
      'contrib-001',
      { status: 'approved' },
      'admin-user-id',
    );

    expect(result.status).toBe('approved');
    expect(applyContribution).toHaveBeenCalledOnce();
  });

  it('rejects contribution without triggering enrichment', async () => {
    const { applyContribution } = await import('../services/enrichmentService.js');

    vi.mocked(prisma.contribution.findUnique).mockResolvedValue(makeContribRow() as never);
    vi.mocked(prisma.contribution.update).mockResolvedValue(
      makeContribRow({ status: 'rejected' }) as never,
    );

    const result = await moderateContribution(
      'contrib-001',
      { status: 'rejected', adminNote: 'Insufficient evidence' },
      'admin-user-id',
    );

    expect(result.status).toBe('rejected');
    expect(applyContribution).not.toHaveBeenCalled();
  });

  it('throws 404 when contribution not found', async () => {
    vi.mocked(prisma.contribution.findUnique).mockResolvedValue(null);

    await expect(
      moderateContribution('missing-id', { status: 'approved' }, 'admin-id'),
    ).rejects.toMatchObject({ status: 404 });
  });
});
