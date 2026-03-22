// apps/api/src/__tests__/stolen.routes.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import stolenRouter from '../routes/stolen';
import { errorHandler } from '../middleware/errorHandler';

// ── Mock service + validator layers ──────────────
vi.mock('../services/stolenReportService.js', () => ({
  submitReport: vi.fn(),
  getByPlate: vi.fn(),
  getByVin: vi.fn(),
  getById: vi.fn(),
  reviewReport: vi.fn(),
  markRecovered: vi.fn(),
}));

vi.mock('../validators/stolenValidator.js', () => ({
  validateStolenSubmission: vi.fn(),
  validateRecoverySubmission: vi.fn(),
}));

vi.mock('../middleware/requireRole.js', () => ({
  requireRole: () => (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const user = (req as Request & { user?: { role: string } }).user;
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  },
}));

import {
  submitReport,
  getByPlate,
  getByVin,
  getById,
  reviewReport,
  markRecovered,
} from '../services/stolenReportService.js';
import {
  validateStolenSubmission,
  validateRecoverySubmission,
} from '../validators/stolenValidator.js';

function buildApp(user?: { id: string; role: string }) {
  const app = express();
  app.use(express.json());
  if (user) {
    app.use((req, _res, next) => {
      (req as express.Request & { user: typeof user }).user = user;
      next();
    });
  }
  app.use('/stolen-reports', stolenRouter);
  app.use(errorHandler);
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

beforeEach(() => vi.clearAllMocks());

// ---------------------------------------------------------------------------
// POST /stolen-reports
// ---------------------------------------------------------------------------
describe('POST /stolen-reports', () => {
  it('returns 201 on valid anonymous submission', async () => {
    vi.mocked(validateStolenSubmission).mockReturnValue({ valid: true, errors: [] });
    vi.mocked(submitReport).mockResolvedValue(makeReport() as never);

    const res = await request(buildApp())
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

    expect(res.status).toBe(201);
    expect(res.body.report.id).toBe('sr-001');
    expect(res.body.message).toMatch(/received/i);
    expect(submitReport).toHaveBeenCalledWith(expect.anything(), null);
  });

  it('passes user id when authenticated', async () => {
    vi.mocked(validateStolenSubmission).mockReturnValue({ valid: true, errors: [] });
    vi.mocked(submitReport).mockResolvedValue(makeReport() as never);

    await request(buildApp({ id: 'user-xyz', role: 'user' }))
      .post('/stolen-reports')
      .send({ plate: 'KCA123A' });

    expect(submitReport).toHaveBeenCalledWith(expect.anything(), 'user-xyz');
  });

  it('returns 400 on validation failure', async () => {
    vi.mocked(validateStolenSubmission).mockReturnValue({
      valid: false,
      errors: ['plate is required', 'carColor is required'],
    });

    const res = await request(buildApp()).post('/stolen-reports').send({});

    expect(res.status).toBe(400);
    expect(res.body.details).toContain('plate is required');
    expect(submitReport).not.toHaveBeenCalled();
  });

  it('returns 409 on duplicate report', async () => {
    vi.mocked(validateStolenSubmission).mockReturnValue({ valid: true, errors: [] });
    vi.mocked(submitReport).mockRejectedValue(
      Object.assign(new Error('A report for this vehicle was recently submitted'), {
        status: 409,
      }),
    );

    const res = await request(buildApp()).post('/stolen-reports').send({ plate: 'KCA123A' });

    expect(res.status).toBe(409);
  });
});

// ---------------------------------------------------------------------------
// GET /stolen-reports/plate/:plate  — FREE, no auth
// ---------------------------------------------------------------------------
describe('GET /stolen-reports/plate/:plate', () => {
  it('returns reports and hasActiveReport flag', async () => {
    vi.mocked(getByPlate).mockResolvedValue([
      makeReport({ status: 'active' }),
    ] as never);

    const res = await request(buildApp()).get('/stolen-reports/plate/KCA123A');

    expect(res.status).toBe(200);
    expect(res.body.hasActiveReport).toBe(true);
    expect(res.body.reports).toHaveLength(1);
    expect(getByPlate).toHaveBeenCalledWith('KCA123A');
  });

  it('returns hasActiveReport=false when no active reports', async () => {
    vi.mocked(getByPlate).mockResolvedValue([
      makeReport({ status: 'rejected' }),
    ] as never);

    const res = await request(buildApp()).get('/stolen-reports/plate/KCA123A');

    expect(res.body.hasActiveReport).toBe(false);
  });

  it('returns empty result for unknown plate', async () => {
    vi.mocked(getByPlate).mockResolvedValue([] as never);

    const res = await request(buildApp()).get('/stolen-reports/plate/UNKNOWN');

    expect(res.status).toBe(200);
    expect(res.body.hasActiveReport).toBe(false);
    expect(res.body.reports).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// GET /stolen-reports/vin/:vin
// ---------------------------------------------------------------------------
describe('GET /stolen-reports/vin/:vin', () => {
  it('returns reports by VIN', async () => {
    vi.mocked(getByVin).mockResolvedValue([
      makeReport({ vin: 'JTDBR32E540012345', status: 'active' }),
    ] as never);

    const res = await request(buildApp()).get('/stolen-reports/vin/JTDBR32E540012345');

    expect(res.status).toBe(200);
    expect(res.body.hasActiveReport).toBe(true);
    expect(getByVin).toHaveBeenCalledWith('JTDBR32E540012345');
  });
});

// ---------------------------------------------------------------------------
// GET /stolen-reports/:id
// ---------------------------------------------------------------------------
describe('GET /stolen-reports/:id', () => {
  it('hides contact info from anonymous users', async () => {
    vi.mocked(getById).mockResolvedValue(
      makeReport({ contactPhone: '0712345678', contactEmail: 'owner@example.com' }) as never,
    );

    const res = await request(buildApp()).get('/stolen-reports/sr-001');

    expect(res.status).toBe(200);
    expect(res.body.report.contactPhone).toBeUndefined();
    expect(res.body.report.contactEmail).toBeUndefined();
  });

  it('shows contact info to the original reporter', async () => {
    vi.mocked(getById).mockResolvedValue(
      makeReport({ reporterUserId: 'owner-id', contactPhone: '0712345678' }) as never,
    );

    const res = await request(buildApp({ id: 'owner-id', role: 'user' }))
      .get('/stolen-reports/sr-001');

    expect(res.status).toBe(200);
    expect(res.body.report.contactPhone).toBe('0712345678');
  });

  it('shows contact info to admin', async () => {
    vi.mocked(getById).mockResolvedValue(
      makeReport({ contactPhone: '0712345678' }) as never,
    );

    const res = await request(buildApp({ id: 'admin-id', role: 'admin' }))
      .get('/stolen-reports/sr-001');

    expect(res.body.report.contactPhone).toBe('0712345678');
  });

  it('returns 404 for missing report', async () => {
    vi.mocked(getById).mockResolvedValue(null);

    const res = await request(buildApp()).get('/stolen-reports/missing');
    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// PATCH /stolen-reports/:id/review  (admin only)
// ---------------------------------------------------------------------------
describe('PATCH /stolen-reports/:id/review', () => {
  it('returns 403 for non-admin', async () => {
    const res = await request(buildApp({ id: 'user-id', role: 'user' }))
      .patch('/stolen-reports/sr-001/review')
      .send({ status: 'active' });

    expect(res.status).toBe(403);
    expect(reviewReport).not.toHaveBeenCalled();
  });

  it('approves report as admin', async () => {
    vi.mocked(reviewReport).mockResolvedValue(
      makeReport({ status: 'active', isObVerified: true }) as never,
    );

    const res = await request(buildApp({ id: 'admin-id', role: 'admin' }))
      .patch('/stolen-reports/sr-001/review')
      .send({ status: 'active', isObVerified: true });

    expect(res.status).toBe(200);
    expect(res.body.report.status).toBe('active');
    expect(reviewReport).toHaveBeenCalledWith(
      'sr-001',
      { status: 'active', adminNote: undefined, isObVerified: true },
      'admin-id',
    );
  });

  it('rejects report as admin', async () => {
    vi.mocked(reviewReport).mockResolvedValue(
      makeReport({ status: 'rejected', adminNote: 'Fake report' }) as never,
    );

    const res = await request(buildApp({ id: 'admin-id', role: 'admin' }))
      .patch('/stolen-reports/sr-001/review')
      .send({ status: 'rejected', adminNote: 'Fake report' });

    expect(res.status).toBe(200);
    expect(res.body.report.status).toBe('rejected');
  });

  it('returns 400 for invalid status value', async () => {
    const res = await request(buildApp({ id: 'admin-id', role: 'admin' }))
      .patch('/stolen-reports/sr-001/review')
      .send({ status: 'maybe' });

    expect(res.status).toBe(400);
    expect(reviewReport).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// POST /stolen-reports/:id/recovered
// ---------------------------------------------------------------------------
describe('POST /stolen-reports/:id/recovered', () => {
  it('marks report recovered (anonymous — allowed for now, service enforces ownership)', async () => {
    vi.mocked(validateRecoverySubmission).mockReturnValue({ valid: true, errors: [] });
    vi.mocked(markRecovered).mockResolvedValue(
      makeReport({ status: 'recovered' }) as never,
    );

    const res = await request(buildApp())
      .post('/stolen-reports/sr-001/recovered')
      .send({ recoveryDate: '2024-07-01', recoveryCounty: 'Nairobi' });

    expect(res.status).toBe(200);
    expect(res.body.report.status).toBe('recovered');
    expect(res.body.message).toMatch(/recovered/i);
  });

  it('returns 400 on recovery validation failure', async () => {
    vi.mocked(validateRecoverySubmission).mockReturnValue({
      valid: false,
      errors: ['recoveryDate is required'],
    });

    const res = await request(buildApp())
      .post('/stolen-reports/sr-001/recovered')
      .send({});

    expect(res.status).toBe(400);
    expect(markRecovered).not.toHaveBeenCalled();
  });

  it('returns 403 when service rejects unauthorized recovery', async () => {
    vi.mocked(validateRecoverySubmission).mockReturnValue({ valid: true, errors: [] });
    vi.mocked(markRecovered).mockRejectedValue(
      Object.assign(new Error('Unauthorized'), { status: 403 }),
    );

    const res = await request(buildApp({ id: 'wrong-user', role: 'user' }))
      .post('/stolen-reports/sr-001/recovered')
      .send({ recoveryDate: '2024-07-01', recoveryCounty: 'Nairobi' });

    expect(res.status).toBe(403);
  });
});
