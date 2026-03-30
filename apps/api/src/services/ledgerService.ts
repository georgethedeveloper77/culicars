// ============================================================
// CuliCars — Thread 6: Ledger Service
// ============================================================
// APPEND ONLY. Never UPDATE or DELETE rows in credit_ledger.
// Every credit mutation gets a ledger entry with balance snapshot.
// ============================================================

import prisma from '../lib/prisma';
import type { PrismaClient } from '@prisma/client';
import type { LedgerType } from '../types/payment.types';

type TxClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

export interface CreateLedgerEntryInput {
  user_id: string;
  type: LedgerType;
  credits_delta: number;     // positive = gain, negative = spend
  balance_before: number;
  balance_after: number;
  source: string;           // e.g. 'mpesa_purchase', 'report_unlock', 'admin_grant'
  report_id?: string;
  tx_ref?: string;           // provider transaction reference
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
  return tx.credit_ledger.create({
    data: {
      user_id: input.user_id,
      type: input.type,
      credits_delta: input.credits_delta,
      balance_before: input.balance_before,
      balance_after: input.balance_after,
      source: input.source,
      report_id: input.report_id ?? null,
      tx_ref: input.tx_ref ?? null,
      metadata: (input.metadata ?? undefined) as any,
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
    prisma.credit_ledger.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      take: limit,
      skip: offset,
      select: {
        id: true,
        type: true,
        credits_delta: true,
        balance_before: true,
        balance_after: true,
        source: true,
        report_id: true,
        tx_ref: true,
        metadata: true,
        created_at: true,
      },
    }),
    prisma.credit_ledger.count({ where: { user_id: userId } }),
  ]);

  return { entries, total, limit, offset };
}

/**
 * Get a single ledger entry by txRef (for idempotency checks).
 */
export async function getEntryByTxRef(txRef: string) {
  return prisma.credit_ledger.findFirst({
    where: { tx_ref: txRef },
  });
}
