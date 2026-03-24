"use strict";
// ============================================================
// CuliCars — Thread 6: Credit Service
// ============================================================
// Orchestrates wallet + ledger in a single atomic transaction.
// This is the ONLY way credits should be added or removed.
// ============================================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.grantCredits = grantCredits;
exports.deductCredits = deductCredits;
exports.adminGrantCredits = adminGrantCredits;
exports.adminDeductCredits = adminDeductCredits;
const prisma_1 = __importDefault(require("../lib/prisma"));
const walletService_1 = require("./walletService");
const ledgerService_1 = require("./ledgerService");
/**
 * Grant credits to a user. Used after successful payment webhook.
 * Atomic: wallet credit + ledger entry in one transaction.
 *
 * @returns The new balance after granting
 * @throws If txRef already exists (idempotent — safe to retry)
 */
async function grantCredits(input) {
    const { userId, credits, type, source, txRef, reportId, metadata } = input;
    if (credits <= 0)
        throw new Error('Credits must be positive');
    // Idempotency: if txRef already used, return current balance
    if (txRef) {
        const existing = await prisma_1.default.creditLedger.findFirst({
            where: { txRef },
        });
        if (existing) {
            const currentBalance = await (0, walletService_1.getBalance)(userId);
            return currentBalance;
        }
    }
    const newBalance = await prisma_1.default.$transaction(async (tx) => {
        // 1. Get balance BEFORE
        const wallet = await tx.wallet.findUnique({
            where: { userId },
            select: { balance: true },
        });
        const balanceBefore = wallet?.balance ?? 0;
        // 2. Credit wallet
        const balanceAfter = await (0, walletService_1.creditWallet)(tx, userId, credits);
        // 3. Append ledger entry (NEVER update/delete)
        await (0, ledgerService_1.appendEntry)(tx, {
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
async function deductCredits(input) {
    const { userId, credits, type, source, reportId, metadata } = input;
    if (credits <= 0)
        throw new Error('Credits must be positive');
    const newBalance = await prisma_1.default.$transaction(async (tx) => {
        // 1. Get balance BEFORE
        const wallet = await tx.wallet.findUnique({
            where: { userId },
            select: { balance: true },
        });
        const balanceBefore = wallet?.balance ?? 0;
        if (balanceBefore < credits) {
            throw new Error(`Insufficient credits. Have ${balanceBefore}, need ${credits}.`);
        }
        // 2. Debit wallet (DB CHECK constraint is the safety net)
        const balanceAfter = await (0, walletService_1.debitWallet)(tx, userId, credits);
        // 3. Append ledger entry
        await (0, ledgerService_1.appendEntry)(tx, {
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
async function adminGrantCredits(adminUserId, targetUserId, credits, reason) {
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
async function adminDeductCredits(adminUserId, targetUserId, credits, reason) {
    return deductCredits({
        userId: targetUserId,
        credits,
        type: 'admin_deduct',
        source: 'admin_deduct',
        metadata: { deductedBy: adminUserId, reason },
    });
}
