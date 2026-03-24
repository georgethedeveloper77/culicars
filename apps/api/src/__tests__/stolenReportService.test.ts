// apps/api/src/__tests__/stolenReportService.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../lib/prisma.js', () => ({
  default: {
    stolen_reports: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    vehicles: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    plate_vin_map: {
      findFirst: vi.fn(),
      upsert: vi.fn(),
    },
    vehicle_events: {
      create: vi.fn(),
    },
    reports: {
      updateMany: vi.fn(),
    },
  },
}));

import prisma from '../lib/prisma';
import {
  submitReport,
  getByPlate,
  getByVin,
  reviewReport,
  markRecovered,
} from '../services/stolenReportService.js';

const baseSubmission = {
  plate: 'KCA123A',
  dateStolenIso: '2024-06-15',
  countyStolen: 'Nairobi',
  townStolen: 'Westlands',
  carColor: 'White',
  reporterType: 'owner' as const,
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

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// submitReport
// ---------------------------------------------------------------------------
describe('submitReport', () => {
  it('creates a pending report', async () => {
    vi.mocked(prisma.stolenReport.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.stolenReport.create).mockResolvedValue(makeReportRow() as never);

    const result = await submitReport(baseSubmission, null);

    expect(prisma.stolenReport.create).toHaveBeenCalledOnce();
    const createArgs = vi.mocked(prisma.stolenReport.create).mock.calls[0][0] as {
      data: Record<string, unknown>;
    };
    expect(createArgs.data['plate']).toBe('KCA123A'); // normalised
    expect(createArgs.data['status']).toBe('pending');
    expect(result.status).toBe('pending');
  });

  it('normalises plate by removing spaces and uppercasing', async () => {
    vi.mocked(prisma.stolenReport.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.stolenReport.create).mockResolvedValue(makeReportRow() as never);

    await submitReport({ ...baseSubmission, plate: 'kca 123a' }, null);

    const createArgs = vi.mocked(prisma.stolenReport.create).mock.calls[0][0] as {
      data: Record<string, unknown>;
    };
    expect(createArgs.data['plate']).toBe('KCA123A');
  });

  it('rejects duplicate report submitted within 24 hours', async () => {
    vi.mocked(prisma.stolenReport.findFirst).mockResolvedValue(makeReportRow() as never);

    await expect(submitReport(baseSubmission, null)).rejects.toMatchObject({ status: 409 });
  });

  it('stores reporter user_id when authenticated', async () => {
    vi.mocked(prisma.stolenReport.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.stolenReport.create).mockResolvedValue(makeReportRow() as never);

    await submitReport(baseSubmission, 'user-xyz');

    const createArgs = vi.mocked(prisma.stolenReport.create).mock.calls[0][0] as {
      data: Record<string, unknown>;
    };
    expect(createArgs.data['reporter_user_id']).toBe('user-xyz');
  });
});

// ---------------------------------------------------------------------------
// getByPlate / getByVin
// ---------------------------------------------------------------------------
describe('getByPlate', () => {
  it('returns reports for a normalised plate', async () => {
    vi.mocked(prisma.stolenReport.findMany).mockResolvedValue([makeReportRow()] as never);

    const results = await getByPlate('KCA 123A');

    expect(prisma.stolenReport.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { plate: 'KCA123A' } }),
    );
    expect(results).toHaveLength(1);
  });
});

describe('getByVin', () => {
  it('returns reports for a VIN', async () => {
    vi.mocked(prisma.stolenReport.findMany).mockResolvedValue([
      makeReportRow({ vin: 'JTDBR32E540012345' }),
    ] as never);

    const results = await getByVin('JTDBR32E540012345');
    expect(results[0].vin).toBe('JTDBR32E540012345');
  });
});

// ---------------------------------------------------------------------------
// reviewReport (admin approve)
// ---------------------------------------------------------------------------
describe('reviewReport', () => {
  it('approves report and creates STOLEN vehicle event when VIN known', async () => {
    const reportWithVin = makeReportRow({
      vin: 'JTDBR32E540012345',
      status: 'active',
    });

    vi.mocked(prisma.stolenReport.findUnique).mockResolvedValue(
      makeReportRow() as never,
    );
    vi.mocked(prisma.stolenReport.update).mockResolvedValue(reportWithVin as never);
    vi.mocked(prisma.vehicle.findUnique).mockResolvedValue({ vin: 'JTDBR32E540012345' } as never);
    vi.mocked(prisma.vehicleEvent.create).mockResolvedValue({} as never);
    vi.mocked(prisma.report.updateMany).mockResolvedValue({ count: 1 } as never);

    const result = await reviewReport(
      'report-001',
      { status: 'active', isObVerified: true },
      'admin-id',
    );

    expect(result.status).toBe('active');
    expect(prisma.vehicleEvent.create).toHaveBeenCalledOnce();
    const eventArgs = vi.mocked(prisma.vehicleEvent.create).mock.calls[0][0] as {
      data: Record<string, unknown>;
    };
    expect(eventArgs.data['event_type']).toBe('STOLEN');
  });

  it('creates vehicle record if VIN is provided but vehicle not in DB', async () => {
    const reportWithVin = makeReportRow({
      vin: 'NEWVIN00000000001',
      status: 'active',
    });

    vi.mocked(prisma.stolenReport.findUnique).mockResolvedValue(makeReportRow() as never);
    vi.mocked(prisma.stolenReport.update).mockResolvedValue(reportWithVin as never);
    vi.mocked(prisma.vehicle.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.vehicle.create).mockResolvedValue({} as never);
    vi.mocked(prisma.plateVinMap.upsert).mockResolvedValue({} as never);
    vi.mocked(prisma.vehicleEvent.create).mockResolvedValue({} as never);
    vi.mocked(prisma.report.updateMany).mockResolvedValue({ count: 0 } as never);

    await reviewReport('report-001', { status: 'active' }, 'admin-id');

    expect(prisma.vehicle.create).toHaveBeenCalledOnce();
  });

  it('marks existing reports as stale on approval', async () => {
    const reportWithVin = makeReportRow({ vin: 'JTDBR32E540012345', status: 'active' });

    vi.mocked(prisma.stolenReport.findUnique).mockResolvedValue(makeReportRow() as never);
    vi.mocked(prisma.stolenReport.update).mockResolvedValue(reportWithVin as never);
    vi.mocked(prisma.vehicle.findUnique).mockResolvedValue({ vin: 'JTDBR32E540012345' } as never);
    vi.mocked(prisma.vehicleEvent.create).mockResolvedValue({} as never);
    vi.mocked(prisma.report.updateMany).mockResolvedValue({ count: 2 } as never);

    await reviewReport('report-001', { status: 'active' }, 'admin-id');

    expect(prisma.report.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: 'stale' } }),
    );
  });

  it('throws 404 for missing report', async () => {
    vi.mocked(prisma.stolenReport.findUnique).mockResolvedValue(null);

    await expect(
      reviewReport('no-such-id', { status: 'active' }, 'admin-id'),
    ).rejects.toMatchObject({ status: 404 });
  });
});

// ---------------------------------------------------------------------------
// markRecovered
// ---------------------------------------------------------------------------
describe('markRecovered', () => {
  it('marks an active report as recovered and adds RECOVERED event', async () => {
    vi.mocked(prisma.stolenReport.findUnique).mockResolvedValue(
      makeReportRow({ status: 'active', vin: 'JTDBR32E540012345' }) as never,
    );
    vi.mocked(prisma.stolenReport.update).mockResolvedValue(
      makeReportRow({ status: 'recovered', vin: 'JTDBR32E540012345' }) as never,
    );
    vi.mocked(prisma.vehicleEvent.create).mockResolvedValue({} as never);
    vi.mocked(prisma.report.updateMany).mockResolvedValue({ count: 1 } as never);

    const result = await markRecovered(
      'report-001',
      { recoveryDate: '2024-07-01', recoveryCounty: 'Nairobi' },
      null,
    );

    expect(result.status).toBe('recovered');
    expect(prisma.vehicleEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ event_type: 'RECOVERED' }),
      }),
    );
  });

  it('rejects recovery on non-active report', async () => {
    vi.mocked(prisma.stolenReport.findUnique).mockResolvedValue(
      makeReportRow({ status: 'pending' }) as never,
    );

    await expect(
      markRecovered(
        'report-001',
        { recoveryDate: '2024-07-01', recoveryCounty: 'Nairobi' },
        null,
      ),
    ).rejects.toMatchObject({ status: 400 });
  });

  it('throws 403 when a different user tries to mark recovered', async () => {
    vi.mocked(prisma.stolenReport.findUnique).mockResolvedValue(
      makeReportRow({ status: 'active', reporter_user_id: 'owner-id' }) as never,
    );

    await expect(
      markRecovered(
        'report-001',
        { recoveryDate: '2024-07-01', recoveryCounty: 'Nairobi' },
        'other-user-id',
      ),
    ).rejects.toMatchObject({ status: 403 });
  });
});
