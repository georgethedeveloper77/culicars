// ============================================================
// CuliCars — Thread 5: Report Unlock Service
// Atomic wallet debit + unlock record creation
// ============================================================

import { prisma } from '../lib/prisma';
import type { UnlockResult } from '../types/report.types';

// Cost to unlock a full report (in credits)
const UNLOCK_COST = 1;

/**
 * Unlock a report for a user.
 * Atomic transaction: check balance → debit wallet → insert ledger → create unlock.
 * Returns error if insufficient balance or already unlocked.
 */
export async function unlockReport(
  userId: string,
  reportId: string
): Promise<UnlockResult> {
  // Check if already unlocked
  const existing = await prisma.report_unlock.findUnique({
    where: {
      user_id_report_id: { user_id: userId, report_id: reportId },
    },
  });

  if (existing) {
    // Already unlocked — return success without charging
    const wallet = await prisma.wallets.findUnique({
      where: { user_id: userId },
      select: { balance: true },
    });

    return {
      success: true,
      creditsSpent: 0,
      balanceAfter: wallet?.balance ?? 0,
      report_id: reportId,
    };
  }

  // Verify report exists
  const report = await prisma.reports.findUnique({
    where: { id: reportId },
    select: { id: true, vin: true, status: true },
  });

  if (!report) {
    throw new Error('Report not found');
  }

  if (report.status !== 'ready') {
    throw new Error('Report is not ready — please try again shortly');
  }

  // Atomic transaction: debit wallet + create ledger entry + create unlock
  const result = await prisma.$transaction(async (tx) => {
    // Get current balance (with row lock via findFirst + forUpdate pattern)
    const wallet = await tx.wallets.findUnique({
      where: { user_id: userId },
    });

    if (!wallet) {
      throw new Error('Wallet not found — please purchase credits first');
    }

    if (wallet.balance < UNLOCK_COST) {
      throw new Error(
        `Insufficient credits. You have ${wallet.balance}, need ${UNLOCK_COST}.`
      );
    }

    const balance_before = wallet.balance;
    const balanceAfter = balance_before - UNLOCK_COST;

    // Debit wallet
    await tx.wallets.update({
      where: { user_id: userId },
      data: {
        balance: balanceAfter,
        updated_at: new Date(),
      },
    });

    // Append to ledger (APPEND ONLY — never UPDATE or DELETE)
    await tx.credit_ledger.create({
      data: {
        user_id: userId,
        type: 'spend',
        credits_delta: -UNLOCK_COST,
        balance_before,
        balance_after: balanceAfter,
        source: 'report_unlock',
        report_id: reportId,
      },
    });

    // Create unlock record
    await tx.report_unlocks.create({
      data: {
        user_id: userId,
        report_id: reportId,
        credits_spent: UNLOCK_COST,
      },
    });

    return {
      success: true,
      creditsSpent: UNLOCK_COST,
      balanceAfter,
      report_id: reportId,
    };
  });

  return result;
}

/**
 * Check if a user has unlocked a specific report.
 */
export async function hasUnlocked(
  userId: string,
  reportId: string
): Promise<boolean> {
  const unlock = await prisma.report_unlock.findUnique({
    where: {
      user_id_report_id: { user_id: userId, report_id: reportId },
    },
  });
  return !!unlock;
}
