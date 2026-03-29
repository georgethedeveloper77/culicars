// apps/api/src/tests/dataSourcesService.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock prisma ───────────────────────────────────────────────────────────────
const mockSource = {
  id: 'ds-1',
  name: 'Kenya Motor Reg',
  type: 'web',
  parser_type: 'kenyaMotorReg',
  credentials_enc: null,
  schedule: '0 2 * * *',
  enabled: true,
  last_run_at: null,
  last_status: null,
  created_at: new Date(),
  updated_at: new Date(),
};

vi.mock('@culicars/database', () => ({
  prisma: {
    dataSource: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

// ── Mock crypto so tests don't need CREDENTIALS_ENCRYPTION_KEY ───────────────
vi.mock('crypto', async () => {
  const actual = await vi.importActual<typeof import('crypto')>('crypto');
  return {
    ...actual,
    default: {
      ...actual,
      randomBytes: () => Buffer.alloc(12),
      createCipheriv: () => ({
        update: () => Buffer.from('encrypted'),
        final: () => Buffer.from(''),
        getAuthTag: () => Buffer.from('tag12345'),
      }),
      createDecipheriv: () => ({
        update: () => Buffer.from('{"key":"val"}'),
        final: () => Buffer.from(''),
        setAuthTag: vi.fn(),
      }),
    },
  };
});

import { prisma } from '@culicars/database';
import {
  listDataSources,
  getDataSource,
  createDataSource,
  updateDataSource,
  deleteDataSource,
} from '../services/dataSourcesService';

beforeEach(() => {
  vi.clearAllMocks();
  process.env.CREDENTIALS_ENCRYPTION_KEY = 'a'.repeat(64); // 32-byte hex
});

describe('listDataSources', () => {
  it('returns sources without credentials_enc', async () => {
    vi.mocked(prisma.dataSource.findMany).mockResolvedValue([
      { ...mockSource, credentials_enc: 'encrypted-blob' },
    ] as any);

    const result = await listDataSources();
    expect(result[0]).not.toHaveProperty('credentials_enc');
    expect(result[0].has_credentials).toBe(true);
  });

  it('marks has_credentials false when no credentials stored', async () => {
    vi.mocked(prisma.dataSource.findMany).mockResolvedValue([mockSource] as any);
    const result = await listDataSources();
    expect(result[0].has_credentials).toBe(false);
  });
});

describe('getDataSource', () => {
  it('returns null for unknown id', async () => {
    vi.mocked(prisma.dataSource.findUnique).mockResolvedValue(null);
    const result = await getDataSource('nonexistent');
    expect(result).toBeNull();
  });

  it('strips credentials_enc from result', async () => {
    vi.mocked(prisma.dataSource.findUnique).mockResolvedValue({
      ...mockSource,
      credentials_enc: 'blob',
    } as any);
    const result = await getDataSource('ds-1');
    expect(result).not.toHaveProperty('credentials_enc');
    expect(result?.has_credentials).toBe(true);
  });
});

describe('createDataSource', () => {
  it('creates without credentials', async () => {
    vi.mocked(prisma.dataSource.create).mockResolvedValue(mockSource as any);
    const result = await createDataSource({ name: 'Test', type: 'web', parser_type: 'test' });
    expect(prisma.dataSource.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ credentials_enc: null }) }),
    );
    expect(result).not.toHaveProperty('credentials_enc');
  });

  it('encrypts credentials on create', async () => {
    vi.mocked(prisma.dataSource.create).mockResolvedValue(mockSource as any);
    await createDataSource({
      name: 'Test',
      type: 'web',
      parser_type: 'test',
      credentials: { api_key: 'secret' },
    });
    const call = vi.mocked(prisma.dataSource.create).mock.calls[0][0];
    expect(call.data.credentials_enc).toBeTruthy();
    expect(call.data.credentials_enc).not.toContain('secret');
  });
});

describe('updateDataSource', () => {
  it('updates name only', async () => {
    vi.mocked(prisma.dataSource.update).mockResolvedValue({ ...mockSource, name: 'New Name' } as any);
    await updateDataSource('ds-1', { name: 'New Name' });
    const call = vi.mocked(prisma.dataSource.update).mock.calls[0][0];
    expect(call.data).toHaveProperty('name', 'New Name');
    expect(call.data).not.toHaveProperty('credentials_enc');
  });

  it('does not overwrite credentials when not provided', async () => {
    vi.mocked(prisma.dataSource.update).mockResolvedValue(mockSource as any);
    await updateDataSource('ds-1', { enabled: false });
    const call = vi.mocked(prisma.dataSource.update).mock.calls[0][0];
    expect(call.data).not.toHaveProperty('credentials_enc');
  });
});

describe('deleteDataSource', () => {
  it('calls prisma delete', async () => {
    vi.mocked(prisma.dataSource.delete).mockResolvedValue(mockSource as any);
    await deleteDataSource('ds-1');
    expect(prisma.dataSource.delete).toHaveBeenCalledWith({ where: { id: 'ds-1' } });
  });
});
