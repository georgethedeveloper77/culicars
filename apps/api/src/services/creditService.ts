// ============================================================
// CuliCars — Thread 6: Credit Service
// ============================================================
// Orchestrates wallet + ledger in a single atomic transaction.
// This is the ONLY way credits should be added or removed.
// ============================================================

import prisma from '../lib/prisma';
import { creditWallet, debitWallet, getBalance } from './walletService';
import { appendEntry } from './ledgerService';
import type { LedgerType } from '../types/payment.types';

interface GrantCreditsInput {
  userId: string;
  credits: number;
  type: LedgerType;        // 'purchase' | 'bonus' | 'refund' | 'admin_grant'
  source: string;          // e.g. 'mpesa_purchase', 'admin_grant'
  txRef?: string;          // provider transaction reference (idempotency)
  reportId?: string;
  metadata?: Record<string, unknown>;
}

interface DeductCreditsInput {
  userId: string;
  credits: number;
  type: LedgerType;        // typically 'spend'
  source: string;          // e.g. 'report_unlock'
  reportId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Grant credits to a user. Used after successful payment webhook.
 * Atomic: wallet credit + ledger entry in one transaction.
 *
 * @returns The new balance after granting
 * @throws If txRef already exists (idempotent — safe to retry)
 */
export async function grantCredits(input: GrantCreditsInput): Promise<number> {
  const { userId, credits, type, source, txRef, reportId, metadata } = input;

  if (credits <= 0) throw new Error('Credits must be positive');

  // Idempotency: if txRef already used, return current balance
  if (txRef) {
    const existing = await prisma.creditLedger.findFirst({
      where: { txRef },
    });
    if (existing) {
      const currentBalance = await getBalance(userId);
      return currentBalance;
    }
  }

  const newBalance = await prisma.$transaction(async (tx) => {
    // 1. Get balance BEFORE
    const wallet = await tx.wallet.findUnique({
      where: { userId },
      select: { balance: true },
    });
    const balanceBefore = wallet?.balance ?? 0;

    // 2. Credit wallet
    const balanceAfter = await creditWallet(tx, userId, credits);

    // 3. Append ledger entry (NEVER update/delete)
    await appendEntry(tx, {
      userId,
      type,
      creditsDelta: credits,
      balanceBefore,
      balanceAfter,
      source,
      txRef,
      reportId,
      metadata,
    });

    return balanceAfter;
  });

  return newBalance;
}

/**
 * Deduct credits from a user. Used for report unlocks.
 * Atomic: wallet debit + ledger entry in one transaction.
 *
 * @returns The new balance after deduction
 * @throws If insufficient balance (DB CHECK constraint)
 */
export async function deductCredits(input: DeductCreditsInput): Promise<number> {
  const { userId, credits, type, source, reportId, metadata } = input;

  if (credits <= 0) throw new Error('Credits must be positive');

  const newBalance = await prisma.$transaction(async (tx) => {
    // 1. Get balance BEFORE
    const wallet = await tx.wallet.findUnique({
      where: { userId },
      select: { balance: true },
    });
    const balanceBefore = wallet?.balance ?? 0;

    if (balanceBefore < credits) {
      throw new Error(
        `Insufficient credits. Have ${balanceBefore}, need ${credits}.`
      );
    }

    // 2. Debit wallet (DB CHECK constraint is the safety net)
    const balanceAfter = await debitWallet(tx, userId, credits);

    // 3. Append ledger entry
    await appendEntry(tx, {
      userId,
      type,
      creditsDelta: -credits,
      balanceBefore,
      balanceAfter,
      source,
      reportId,
      metadata,
    });

    return balanceAfter;
  });

  return newBalance;
}

/**
 * Admin: grant credits manually (e.g. support, promo, correction).
 */
export async function adminGrantCredits(
  adminUserId: string,
  targetUserId: string,
  credits: number,
  reason: string
): Promise<number> {
  return grantCredits({
    userId: targetUserId,
    credits,
    type: 'admin_grant',
    source: 'admin_grant',
    metadata: { grantedBy: adminUserId, reason },
  });
}

/**
 * Admin: deduct credits manually (e.g. abuse correction).
 */
export async function adminDeductCredits(
  adminUserId: string,
  targetUserId: string,
  credits: number,
  reason: string
): Promise<number> {
  return deductCredits({
    userId: targetUserId,
    credits,
    type: 'admin_deduct',
    source: 'admin_deduct',
    metadata: { deductedBy: adminUserId, reason },
  });
}
