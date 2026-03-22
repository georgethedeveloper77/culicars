// ============================================================
// CuliCars — Thread 6: Ledger Service
// ============================================================
// APPEND ONLY. Never UPDATE or DELETE rows in credit_ledger.
// Every credit mutation gets a ledger entry with balance snapshot.
// ============================================================

import prisma from '../lib/prisma';
import type { PrismaClient } from '@culicars/database';
import type { LedgerType } from '../types/payment.types';

type TxClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

export interface CreateLedgerEntryInput {
  userId: string;
  type: LedgerType;
  creditsDelta: number;     // positive = gain, negative = spend
  balanceBefore: number;
  balanceAfter: number;
  source: string;           // e.g. 'mpesa_purchase', 'report_unlock', 'admin_grant'
  reportId?: string;
  txRef?: string;           // provider transaction reference
  metadata?: Record<string, unknown>;
}

/**
 * Append a single ledger entry. Called inside a transaction.
 * NEVER updates or deletes existing entries.
 */
export async function appendEntry(
  tx: TxClient,
  input: CreateLedgerEntryInput
) {
  return tx.creditLedger.create({
    data: {
      userId: input.userId,
      type: input.type,
      creditsDelta: input.creditsDelta,
      balanceBefore: input.balanceBefore,
      balanceAfter: input.balanceAfter,
      source: input.source,
      reportId: input.reportId ?? null,
      txRef: input.txRef ?? null,
      metadata: input.metadata ?? undefined,
    },
  });
}

/**
 * Get paginated ledger history for a user.
 * Most recent first.
 */
export async function getUserLedger(
  userId: string,
  options: { limit?: number; offset?: number } = {}
) {
  const { limit = 50, offset = 0 } = options;

  const [entries, total] = await Promise.all([
    prisma.creditLedger.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      select: {
        id: true,
        type: true,
        creditsDelta: true,
        balanceBefore: true,
        balanceAfter: true,
        source: true,
        reportId: true,
        txRef: true,
        metadata: true,
        createdAt: true,
      },
    }),
    prisma.creditLedger.count({ where: { userId } }),
  ]);

  return { entries, total, limit, offset };
}

/**
 * Get a single ledger entry by txRef (for idempotency checks).
 */
export async function getEntryByTxRef(txRef: string) {
  return prisma.creditLedger.findFirst({
    where: { txRef },
  });
}
