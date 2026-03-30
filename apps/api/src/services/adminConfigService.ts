// apps/api/src/services/adminConfigService.ts

import { prisma } from '../lib/prisma';
import type {
  AdminConfigKey,
  AdminConfigMap,
  AdminConfigRow,
} from '@culicars/types';

// Simple in-process TTL cache — avoids a DB round-trip on every request
interface CacheEntry {
  value: AdminConfigMap[AdminConfigKey];
  expiresAt: number;
}

const CACHE_TTL_MS = 60_000; // 1 minute
const cache = new Map<AdminConfigKey, CacheEntry>();

function cacheGet<K extends AdminConfigKey>(key: K): AdminConfigMap[K] | null {
  const entry = cache.get(key);
  if (!entry || Date.now() > entry.expiresAt) return null;
  return entry.value as AdminConfigMap[K];
}

function cacheSet<K extends AdminConfigKey>(
  key: K,
  value: AdminConfigMap[K],
): void {
  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
}

export function invalidateCache(key?: AdminConfigKey): void {
  if (key) {
    cache.delete(key);
  } else {
    cache.clear();
  }
}

// ─── Public API ────────────────────────────────────────────────────────────

export async function getConfig<K extends AdminConfigKey>(
  key: K,
): Promise<AdminConfigMap[K]> {
  const cached = cacheGet(key);
  if (cached !== null) return cached;

  const row = await (prisma as any).admin_config.findUnique({
    where: { key },
  });

  if (!row) {
    throw new Error(`Config key not found: ${key}`);
  }

  const value = row.value as AdminConfigMap[K];
  cacheSet(key, value);
  return value;
}

export async function setConfig<K extends AdminConfigKey>(
  key: K,
  value: AdminConfigMap[K],
  updatedBy: string,
): Promise<AdminConfigRow> {
  const row = await (prisma as any).admin_config.upsert({
    where: { key },
    update: {
      value,
      updated_by: updatedBy,
      updated_at: new Date(),
    },
    create: {
      key,
      value,
      updated_by: updatedBy,
      updated_at: new Date(),
    },
  });

  invalidateCache(key);

  return {
    key: row.key as K,
    value: row.value as AdminConfigMap[K],
    updated_by: row.updated_by,
    updated_at: row.updated_at.toISOString(),
  };
}

export async function getAllConfig(): Promise<AdminConfigRow[]> {
  const rows = await (prisma as any).admin_config.findMany({
    orderBy: { key: 'asc' },
  });

  return rows.map((row: any) => ({
    key: row.key as AdminConfigKey,
    value: row.value,
    updated_by: row.updated_by,
    updated_at: row.updated_at.toISOString(),
  }));
}

// Convenience helpers used by payments routes
export async function getEnabledProvidersForPlatform(
  platform: 'web' | 'app',
): Promise<string[]> {
  const key =
    platform === 'web' ? 'payment_providers_web' : 'payment_providers_app';
  return getConfig(key) as Promise<string[]>;
}

export async function getCreditPacks(platform: 'web' | 'app') {
  const key = platform === 'web' ? 'credit_packs_web' : 'credit_packs_app';
  return getConfig(key);
}
