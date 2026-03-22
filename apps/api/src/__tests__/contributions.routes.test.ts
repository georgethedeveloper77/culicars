// apps/api/src/__tests__/contributions.routes.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import contributionsRouter from '../routes/contributions';
import { errorHandler } from '../middleware/errorHandler';

// ── Mock all service layer calls ──────────────────
vi.mock('../services/contributionService.js', () => ({
  submitContribution: vi.fn(),
  getContributionsByVin: vi.fn(),
  moderateContribution: vi.fn(),
  getContributionById: vi.fn(),
}));

vi.mock('../services/contributionValidator.js', () => ({
  validateContributionSubmission: vi.fn(),
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
  submitContribution,
  getContributionsByVin,
  moderateContribution,
  getContributionById,
} from '../services/contributionService.js';
import { validateContributionSubmission } from '../services/contributionValidator.js';

// Helper to build a test app with optional user attached
function buildApp(user?: { id: string; role: string }) {
  const app = express();
  app.use(express.json());
  if (user) {
    app.use((req, _res, next) => {
      (req as express.Request & { user: typeof user }).user = user;
      next();
    });
  }
  app.use('/contributions', contributionsRouter);
  app.use(errorHandler);
  return app;
}

const mockContrib = {
  id: 'contrib-001',
  vin: 'JTDBR32E540012345',
  userId: null,
  type: 'SERVICE_RECORD',
  title: 'Oil change',
  description: null,
  data: {},
  evidenceUrls: [],
  verificationDocUrls: [],
  status: 'pending',
  adminNote: null,
  reviewedBy: null,
  reviewedAt: null,
  confidenceScore: 0.42,
  createdAt: new Date().toISOString(),
};

beforeEach(() => vi.clearAllMocks());

// ---------------------------------------------------------------------------
// POST /contributions
// ---------------------------------------------------------------------------
describe('POST /contributions', () => {
  it('returns 201 on valid submission (anonymous)', async () => {
    vi.mocked(validateContributionSubmission).mockReturnValue({ valid: true, errors: [] });
    vi.mocked(submitContribution).mockResolvedValue(mockContrib as never);

    const res = await request(buildApp())
      .post('/contributions')
      .send({ vin: 'JTDBR32E540012345', type: 'SERVICE_RECORD', title: 'Oil change' });

    expect(res.status).toBe(201);
    expect(res.body.contribution.id).toBe('contrib-001');
    expect(submitContribution).toHaveBeenCalledWith(
      expect.objectContaining({ vin: 'JTDBR32E540012345' }),
      null, // anonymous
    );
  });

  it('passes user id when authenticated', async () => {
    vi.mocked(validateContributionSubmission).mockReturnValue({ valid: true, errors: [] });
    vi.mocked(submitContribution).mockResolvedValue(mockContrib as never);

    await request(buildApp({ id: 'user-abc', role: 'user' }))
      .post('/contributions')
      .send({ vin: 'JTDBR32E540012345', type: 'SERVICE_RECORD', title: 'Oil change' });

    expect(submitContribution).toHaveBeenCalledWith(expect.anything(), 'user-abc');
  });

  it('returns 400 when validation fails', async () => {
    vi.mocked(validateContributionSubmission).mockReturnValue({
      valid: false,
      errors: ['vin is required', 'type is required'],
    });

    const res = await request(buildApp()).post('/contributions').send({});

    expect(res.status).toBe(400);
    expect(res.body.details).toContain('vin is required');
  });

  it('propagates service errors to errorHandler', async () => {
    vi.mocked(validateContributionSubmission).mockReturnValue({ valid: true, errors: [] });
    vi.mocked(submitContribution).mockRejectedValue(
      Object.assign(new Error('Vehicle not found: X'), { status: 404 }),
    );

    const res = await request(buildApp())
      .post('/contributions')
      .send({ vin: 'BADVIN12345678901', type: 'SERVICE_RECORD', title: 'Test' });

    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});

// ---------------------------------------------------------------------------
// GET /contributions/vin/:vin
// ---------------------------------------------------------------------------
describe('GET /contributions/vin/:vin', () => {
  it('returns approved-only contributions for non-admin', async () => {
    vi.mocked(getContributionsByVin).mockResolvedValue([mockContrib] as never);

    const res = await request(buildApp())
      .get('/contributions/vin/JTDBR32E540012345');

    expect(res.status).toBe(200);
    expect(getContributionsByVin).toHaveBeenCalledWith('JTDBR32E540012345', false);
  });

  it('passes includeAll=true for admin', async () => {
    vi.mocked(getContributionsByVin).mockResolvedValue([mockContrib] as never);

    await request(buildApp({ id: 'admin-id', role: 'admin' }))
      .get('/contributions/vin/JTDBR32E540012345');

    expect(getContributionsByVin).toHaveBeenCalledWith('JTDBR32E540012345', true);
  });
});

// ---------------------------------------------------------------------------
// GET /contributions/:id
// ---------------------------------------------------------------------------
describe('GET /contributions/:id', () => {
  it('returns approved contribution to anonymous user', async () => {
    vi.mocked(getContributionById).mockResolvedValue({
      ...mockContrib,
      status: 'approved',
    } as never);

    const res = await request(buildApp()).get('/contributions/contrib-001');

    expect(res.status).toBe(200);
    expect(res.body.contribution.id).toBe('contrib-001');
  });

  it('returns 403 for pending contribution viewed by non-owner', async () => {
    vi.mocked(getContributionById).mockResolvedValue({
      ...mockContrib,
      status: 'pending',
      userId: 'owner-id',
    } as never);

    const res = await request(buildApp({ id: 'other-user', role: 'user' }))
      .get('/contributions/contrib-001');

    expect(res.status).toBe(403);
  });

  it('returns 404 when not found', async () => {
    vi.mocked(getContributionById).mockResolvedValue(null);

    const res = await request(buildApp()).get('/contributions/missing');
    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});

// ---------------------------------------------------------------------------
// PATCH /contributions/:id/moderate
// ---------------------------------------------------------------------------
describe('PATCH /contributions/:id/moderate', () => {
  it('returns 403 for non-admin', async () => {
    const res = await request(buildApp({ id: 'user-id', role: 'user' }))
      .patch('/contributions/contrib-001/moderate')
      .send({ status: 'approved' });

    expect(res.status).toBe(403);
    expect(moderateContribution).not.toHaveBeenCalled();
  });

  it('approves contribution as admin', async () => {
    vi.mocked(moderateContribution).mockResolvedValue({
      ...mockContrib,
      status: 'approved',
    } as never);

    const res = await request(buildApp({ id: 'admin-id', role: 'admin' }))
      .patch('/contributions/contrib-001/moderate')
      .send({ status: 'approved' });

    expect(res.status).toBe(200);
    expect(res.body.contribution.status).toBe('approved');
    expect(moderateContribution).toHaveBeenCalledWith(
      'contrib-001',
      { status: 'approved', adminNote: undefined },
      'admin-id',
    );
  });

  it('rejects with note as admin', async () => {
    vi.mocked(moderateContribution).mockResolvedValue({
      ...mockContrib,
      status: 'rejected',
      adminNote: 'Duplicate submission',
    } as never);

    const res = await request(buildApp({ id: 'admin-id', role: 'admin' }))
      .patch('/contributions/contrib-001/moderate')
      .send({ status: 'rejected', adminNote: 'Duplicate submission' });

    expect(res.status).toBe(200);
    expect(res.body.contribution.adminNote).toBe('Duplicate submission');
  });

  it('returns 400 for invalid status', async () => {
    const res = await request(buildApp({ id: 'admin-id', role: 'admin' }))
      .patch('/contributions/contrib-001/moderate')
      .send({ status: 'banana' });

    expect(res.status).toBe(400);
    expect(moderateContribution).not.toHaveBeenCalled();
  });
});
