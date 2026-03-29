// apps/api/src/services/paymentConfigService.ts

import { PrismaClient } from '@prisma/client';
import type { CreditPack, PaymentProvider } from '@culicars/types';

const prisma = new PrismaClient();

type Platform = 'web' | 'app';

async function getConfigValue<T>(key: string): Promise<T | null> {
  const row = await (prisma as any).admin_config.findUnique({ where: { key } });
  if (!row) return null;
  try {
    return JSON.parse(row.value) as T;
  } catch {
    return row.value as unknown as T;
  }
}

export async function getEnabledProviders(platform: Platform): Promise<PaymentProvider[]> {
  const key = platform === 'web' ? 'payment_providers_web' : 'payment_providers_app';
  const providers = await getConfigValue<PaymentProvider[]>(key);
  return providers ?? ['mpesa'];
}

export async function getCreditPacks(platform: Platform): Promise<CreditPack[]> {
  const key = platform === 'web' ? 'credit_packs_web' : 'credit_packs_app';
  const packs = await getConfigValue<CreditPack[]>(key);
  return packs ?? [];
}

export async function getPackById(packId: string, platform: Platform): Promise<CreditPack | null> {
  const packs = await getCreditPacks(platform);
  return packs.find((p) => p.id === packId) ?? null;
}
