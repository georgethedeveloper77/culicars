// apps/api/src/routes/__tests__/admin-config.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';

vi.mock('../../middleware/auth', () => ({
  requireAuth: (req: any, _res: any, next: any) => {
    req.user = { id: 'admin-user-id', role: 'admin' };
    next();
  },
  requireRole: (_role: string) => (_req: any, _res: any, next: any) => next(),
}));

vi.mock('../../services/adminConfigService', () => ({
  getAllConfig: vi.fn(),
  getConfig: vi.fn(),
  setConfig: vi.fn(),
}));

import * as configService from '../../services/adminConfigService';
import adminConfigRouter from '../admin-config';

const app = express();
app.use(express.json());
app.use('/admin/config', adminConfigRouter);

beforeEach(() => vi.clearAllMocks());

describe('GET /admin/config', () => {
  it('returns all config rows', async () => {
    vi.mocked(configService.getAllConfig).mockResolvedValue([
      {
        key: 'maintenance_mode',
        value: false,
        updated_by: null,
        updated_at: '2024-01-01T00:00:00Z',
      },
    ]);

    const res = await request(app).get('/admin/config');
    expect(res.status).toBe(200);
    expect(res.body.config).toHaveLength(1);
    expect(res.body.config[0].key).toBe('maintenance_mode');
  });

  it('returns 500 on service error', async () => {
    vi.mocked(configService.getAllConfig).mockRejectedValue(
      new Error('DB error'),
    );

    const res = await request(app).get('/admin/config');
    expect(res.status).toBe(500);
  });
});

describe('GET /admin/config/:key', () => {
  it('returns single config value', async () => {
    vi.mocked(configService.getConfig).mockResolvedValue(false);

    const res = await request(app).get('/admin/config/maintenance_mode');
    expect(res.status).toBe(200);
    expect(res.body.value).toBe(false);
    expect(res.body.key).toBe('maintenance_mode');
  });

  it('returns 404 when key not found', async () => {
    vi.mocked(configService.getConfig).mockRejectedValue(
      new Error('Config key not found: bad_key'),
    );

    const res = await request(app).get('/admin/config/bad_key');
    expect(res.status).toBe(404);
  });

  it('returns 500 on unexpected error', async () => {
    vi.mocked(configService.getConfig).mockRejectedValue(
      new Error('Unexpected failure'),
    );

    const res = await request(app).get('/admin/config/maintenance_mode');
    expect(res.status).toBe(500);
  });
});

describe('PATCH /admin/config/:key', () => {
  it('updates config value and returns updated row', async () => {
    vi.mocked(configService.setConfig).mockResolvedValue({
      key: 'maintenance_mode',
      value: true,
      updated_by: 'admin-user-id',
      updated_at: '2024-01-01T00:00:00Z',
    });

    const res = await request(app)
      .patch('/admin/config/maintenance_mode')
      .send({ value: true });

    expect(res.status).toBe(200);
    expect(res.body.config.value).toBe(true);
    expect(res.body.config.updated_by).toBe('admin-user-id');
  });

  it('returns 400 when value field is missing', async () => {
    const res = await request(app)
      .patch('/admin/config/maintenance_mode')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('value');
  });

  it('passes admin user id to setConfig', async () => {
    vi.mocked(configService.setConfig).mockResolvedValue({
      key: 'ntsa_fetch_enabled',
      value: true,
      updated_by: 'admin-user-id',
      updated_at: '2024-01-01T00:00:00Z',
    });

    await request(app)
      .patch('/admin/config/ntsa_fetch_enabled')
      .send({ value: true });

    expect(configService.setConfig).toHaveBeenCalledWith(
      'ntsa_fetch_enabled',
      true,
      'admin-user-id',
    );
  });

  it('returns 500 on service error', async () => {
    vi.mocked(configService.setConfig).mockRejectedValue(new Error('DB error'));

    const res = await request(app)
      .patch('/admin/config/maintenance_mode')
      .send({ value: true });

    expect(res.status).toBe(500);
  });
});
