// apps/api/src/services/__tests__/adminConfigService.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock ../lib/prisma before importing the service
vi.mock('../../lib/prisma', () => {
  const mockFindUnique = vi.fn();
  const mockFindMany = vi.fn();
  const mockUpsert = vi.fn();

  return {
    default: {
      adminConfig: {
        findUnique: mockFindUnique,
        findMany: mockFindMany,
        upsert: mockUpsert,
      },
    },
    __mocks: { mockFindUnique, mockFindMany, mockUpsert },
  };
});

import * as prismaModule from '../../lib/prisma';
import {
  getConfig,
  setConfig,
  getAllConfig,
  getEnabledProvidersForPlatform,
  getCreditPacks,
  invalidateCache,
} from '../adminConfigService';

function getMocks() {
  return (prismaModule as any).__mocks as {
    mockFindUnique: ReturnType<typeof vi.fn>;
    mockFindMany: ReturnType<typeof vi.fn>;
    mockUpsert: ReturnType<typeof vi.fn>;
  };
}

beforeEach(() => {
  invalidateCache();
  const { mockFindUnique, mockFindMany, mockUpsert } = getMocks();
  mockFindUnique.mockReset();
  mockFindMany.mockReset();
  mockUpsert.mockReset();
});

describe('getConfig', () => {
  it('returns parsed value from DB', async () => {
    const { mockFindUnique } = getMocks();
    mockFindUnique.mockResolvedValue({
      key: 'ntsa_fetch_enabled',
      value: false,
      updated_by: null,
      updated_at: new Date(),
    });

    const result = await getConfig('ntsa_fetch_enabled');
    expect(result).toBe(false);
    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { key: 'ntsa_fetch_enabled' },
    });
  });

  it('returns cached value on second call without hitting DB again', async () => {
    const { mockFindUnique } = getMocks();
    mockFindUnique.mockResolvedValue({
      key: 'maintenance_mode',
      value: false,
      updated_by: null,
      updated_at: new Date(),
    });

    await getConfig('maintenance_mode');
    await getConfig('maintenance_mode');

    expect(mockFindUnique).toHaveBeenCalledTimes(1);
  });

  it('throws when key does not exist in DB', async () => {
    const { mockFindUnique } = getMocks();
    mockFindUnique.mockResolvedValue(null);

    await expect(getConfig('ntsa_fetch_enabled')).rejects.toThrow(
      'Config key not found',
    );
  });
});

describe('setConfig', () => {
  it('upserts value and returns updated row', async () => {
    const { mockUpsert } = getMocks();
    const now = new Date();
    mockUpsert.mockResolvedValue({
      key: 'maintenance_mode',
      value: true,
      updated_by: 'user-123',
      updated_at: now,
    });

    const result = await setConfig('maintenance_mode', true, 'user-123');
    expect(result.value).toBe(true);
    expect(result.updated_by).toBe('user-123');
    expect(mockUpsert).toHaveBeenCalled();
  });

  it('invalidates cache so next getConfig hits DB', async () => {
    const { mockUpsert, mockFindUnique } = getMocks();
    const now = new Date();

    mockFindUnique.mockResolvedValueOnce({
      key: 'maintenance_mode',
      value: false,
      updated_by: null,
      updated_at: now,
    });
    await getConfig('maintenance_mode'); // seeds cache

    mockUpsert.mockResolvedValue({
      key: 'maintenance_mode',
      value: true,
      updated_by: 'user-123',
      updated_at: now,
    });
    await setConfig('maintenance_mode', true, 'user-123'); // busts cache

    mockFindUnique.mockResolvedValueOnce({
      key: 'maintenance_mode',
      value: true,
      updated_by: 'user-123',
      updated_at: now,
    });
    await getConfig('maintenance_mode'); // must hit DB again

    expect(mockFindUnique).toHaveBeenCalledTimes(2);
  });
});

describe('getAllConfig', () => {
  it('returns all rows mapped correctly', async () => {
    const { mockFindMany } = getMocks();
    mockFindMany.mockResolvedValue([
      { key: 'maintenance_mode', value: false, updated_by: null, updated_at: new Date('2024-01-01') },
      { key: 'ntsa_fetch_enabled', value: false, updated_by: null, updated_at: new Date('2024-01-01') },
    ]);

    const rows = await getAllConfig();
    expect(rows).toHaveLength(2);
    expect(rows[0].key).toBe('maintenance_mode');
    expect(typeof rows[0].updated_at).toBe('string');
  });
});

describe('getEnabledProvidersForPlatform', () => {
  it('returns web providers for platform=web', async () => {
    const { mockFindUnique } = getMocks();
    mockFindUnique.mockResolvedValue({
      key: 'payment_providers_web',
      value: ['mpesa', 'stripe'],
      updated_by: null,
      updated_at: new Date(),
    });

    const providers = await getEnabledProvidersForPlatform('web');
    expect(providers).toEqual(['mpesa', 'stripe']);
  });

  it('returns app providers for platform=app', async () => {
    const { mockFindUnique } = getMocks();
    mockFindUnique.mockResolvedValue({
      key: 'payment_providers_app',
      value: ['mpesa', 'apple_iap'],
      updated_by: null,
      updated_at: new Date(),
    });

    const providers = await getEnabledProvidersForPlatform('app');
    expect(providers).toEqual(['mpesa', 'apple_iap']);
  });
});

describe('getCreditPacks', () => {
  it('returns web packs for platform=web', async () => {
    const { mockFindUnique } = getMocks();
    const packs = [{ id: 'pack_5', credits: 5, price_kes: 500, price_usd: 4 }];
    mockFindUnique.mockResolvedValue({
      key: 'credit_packs_web',
      value: packs,
      updated_by: null,
      updated_at: new Date(),
    });

    const result = await getCreditPacks('web');
    expect(result).toEqual(packs);
  });

  it('returns app packs for platform=app', async () => {
    const { mockFindUnique } = getMocks();
    const packs = [{ id: 'pack_5', credits: 5, price_usd: 4.99 }];
    mockFindUnique.mockResolvedValue({
      key: 'credit_packs_app',
      value: packs,
      updated_by: null,
      updated_at: new Date(),
    });

    const result = await getCreditPacks('app');
    expect(result).toEqual(packs);
  });
});
