"use strict";
// ============================================================
// CuliCars — Thread 5: Report Unlock Service
// Atomic wallet debit + unlock record creation
// ============================================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.unlockReport = unlockReport;
exports.hasUnlocked = hasUnlocked;
const prisma_1 = __importDefault(require("../lib/prisma"));
// Cost to unlock a full report (in credits)
const UNLOCK_COST = 1;
/**
 * Unlock a report for a user.
 * Atomic transaction: check balance → debit wallet → insert ledger → create unlock.
 * Returns error if insufficient balance or already unlocked.
 */
async function unlockReport(userId, reportId) {
    // Check if already unlocked
    const existing = await prisma_1.default.reportUnlock.findUnique({
        where: {
            userId_reportId: { userId, reportId },
        },
    });
    if (existing) {
        // Already unlocked — return success without charging
        const wallet = await prisma_1.default.wallet.findUnique({
            where: { userId },
            select: { balance: true },
        });
        return {
            success: true,
            creditsSpent: 0,
            balanceAfter: wallet?.balance ?? 0,
            reportId,
        };
    }
    // Verify report exists
    const report = await prisma_1.default.report.findUnique({
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
    const result = await prisma_1.default.$transaction(async (tx) => {
        // Get current balance (with row lock via findFirst + forUpdate pattern)
        const wallet = await tx.wallet.findUnique({
            where: { userId },
        });
        if (!wallet) {
            throw new Error('Wallet not found — please purchase credits first');
        }
        if (wallet.balance < UNLOCK_COST) {
            throw new Error(`Insufficient credits. You have ${wallet.balance}, need ${UNLOCK_COST}.`);
        }
        const balanceBefore = wallet.balance;
        const balanceAfter = balanceBefore - UNLOCK_COST;
        // Debit wallet
        await tx.wallet.update({
            where: { userId },
            data: {
                balance: balanceAfter,
                updatedAt: new Date(),
            },
        });
        // Append to ledger (APPEND ONLY — never UPDATE or DELETE)
        await tx.creditLedger.create({
            data: {
                userId,
                type: 'spend',
                creditsDelta: -UNLOCK_COST,
                balanceBefore,
                balanceAfter,
                source: 'report_unlock',
                reportId,
            },
        });
        // Create unlock record
        await tx.reportUnlock.create({
            data: {
                userId,
                reportId,
                creditsSpent: UNLOCK_COST,
            },
        });
        return {
            success: true,
            creditsSpent: UNLOCK_COST,
            balanceAfter,
            reportId,
        };
    });
    return result;
}
/**
 * Check if a user has unlocked a specific report.
 */
async function hasUnlocked(userId, reportId) {
    const unlock = await prisma_1.default.reportUnlock.findUnique({
        where: {
            userId_reportId: { userId, reportId },
        },
    });
    return !!unlock;
}
