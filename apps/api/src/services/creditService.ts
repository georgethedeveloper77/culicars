type CreditTransactionType = 'purchase' | 'unlock' | 'refund' | 'admin_grant';
// apps/api/src/services/creditService.ts

import { PrismaClient } from '@prisma/client';
import type { PaymentProvider } from '@culicars/types';

const prisma = new PrismaClient();

interface GrantCreditsParams {
  user_id: string;
  amount: number;
  type: string;
  provider?: PaymentProvider;
  providerRef?: string;       // UNIQUE — idempotency guard
  packId?: string;
  reportId?: string;
  meta?: Record<string, unknown>;
}

/**
 * Append a credit transaction to the ledger.
 * Uses providerRef UNIQUE constraint as idempotency guard — safe to call on
 * duplicate webhooks; second call returns null without double-crediting.
 * NEVER updates or deletes existing rows.
 */
export async function appendTransaction(
  params: GrantCreditsParams
): Promise<{ id: string; newBalance: number } | null> {
  const { user_id: userId, amount, type, provider, providerRef, packId, reportId, meta } = params;

  try {
    const tx = await (prisma as any).credit_transactions.create({
      data: {
        user_id: userId,
        amount,
        type,
        provider: provider ?? null,
        provider_ref: providerRef ?? null,
        pack_id: packId ?? null,
        report_id: reportId ?? null,
        status: 'confirmed',
        meta_json: meta ?? null,
      },
    });

    const newBalance = await getBalance(userId);
    return { id: tx.id, newBalance };
  } catch (err: any) {
    // Unique constraint on provider_ref → duplicate webhook — safe to ignore
    if (err?.code === 'P2002' && err?.meta?.target?.includes('provider_ref')) {
      console.warn(`[creditService] Duplicate provider_ref ignored: ${providerRef}`);
      return null;
    }
    throw err;
  }
}

/**
 * Sum all confirmed transactions for a user — this IS the balance.
 * No separate balance column — prevents drift.
 */
export async function getBalance(userId: string): Promise<number> {
  const result = await (prisma as any).credit_transactions.aggregate({
    where: { user_id: userId, status: 'confirmed' },
    _sum: { amount: true },
  });
  return result._sum?.amount ?? 0;
}

/**
 * Deduct credits for a report unlock.
 * Returns false if insufficient balance.
 * Creates an immutable debit record.
 */
export async function deductForUnlock(
  userId: string,
  reportId: string,
  cost = 1
): Promise<{ success: boolean; newBalance: number }> {
  const balance = await getBalance(userId);

  if (balance < cost) {
    return { success: false, newBalance: balance };
  }

  await appendTransaction({
    user_id: userId,
    amount: -cost,
    type: 'unlock',
    reportId,
    meta: { cost_credits: cost },
  });

  const newBalance = await getBalance(userId);
  return { success: true, newBalance };
}

/**
 * Record a pending purchase (before provider confirmation).
 * Returns the transaction ID for matching to the webhook.
 */
export async function recordPendingPurchase(params: {
  user_id: string;
  packId: string;
  provider: PaymentProvider;
  provider_ref: string;
  credits: number;
  meta?: Record<string, unknown>;
}): Promise<string> {
  const tx = await (prisma as any).credit_transactions.create({
    data: {
      user_id: params.user_id,
      amount: params.credits,
      type: 'purchase',
      provider: params.provider,
      provider_ref: params.provider_ref,
      pack_id: params.packId,
      status: 'pending',
      meta_json: params.meta ?? null,
    },
  });
  return tx.id;
}

/**
 * Confirm a pending transaction by provider_ref.
 * Idempotent — if already confirmed, returns existing record.
 */
export async function confirmPayment(
  providerRef: string
): Promise<{ user_id: string; credits: number } | null> {
  const existing = await (prisma as any).credit_transactions.findUnique({
    where: { provider_ref: providerRef },
  });

  if (!existing) {
    console.warn(`[creditService] confirmPayment: no transaction for ref ${providerRef}`);
    return null;
  }

  if (existing.status === 'confirmed') {
    // Already credited — idempotent no-op
    return { user_id: existing.user_id, credits: existing.amount };
  }

  // We can't UPDATE (append-only rule). Instead, mark old as confirmed.
  // In practice we use a separate confirmed_at approach: just upsert status.
  // Exception: status field is operational state, not business data — it's
  // the only mutable field allowed on this table.
  await (prisma as any).credit_transactions.update({
    where: { provider_ref: providerRef },
    data: { status: 'confirmed' },
  });

  return { user_id: existing.user_id, credits: existing.amount };
}
