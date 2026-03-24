"use strict";
// ============================================================
// CuliCars — Thread 6: Wallet Service
// ============================================================
// Server-side only. Balance lives in `wallets` table.
// CHECK (balance >= 0) constraint enforced at DB level.
// All mutations happen inside Prisma interactive transactions.
// ============================================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrCreateWallet = getOrCreateWallet;
exports.getBalance = getBalance;
exports.creditWallet = creditWallet;
exports.debitWallet = debitWallet;
exports.setBalance = setBalance;
const prisma_1 = __importDefault(require("../lib/prisma"));
/**
 * Get or create a wallet for a user.
 * Returns the current balance.
 */
async function getOrCreateWallet(userId) {
    const wallet = await prisma_1.default.wallet.upsert({
        where: { userId },
        update: {},
        create: { userId, balance: 0 },
    });
    return { userId: wallet.userId, balance: wallet.balance, updatedAt: wallet.updatedAt };
}
/**
 * Get wallet balance. Returns 0 if wallet doesn't exist yet.
 */
async function getBalance(userId) {
    const wallet = await prisma_1.default.wallet.findUnique({
        where: { userId },
        select: { balance: true },
    });
    return wallet?.balance ?? 0;
}
/**
 * Credit (add to) a wallet. Used after successful payment.
 * MUST be called inside a Prisma interactive transaction.
 *
 * @param tx - Prisma transaction client
 * @param userId - User to credit
 * @param amount - Positive integer credits to add
 * @returns New balance after credit
 */
async function creditWallet(tx, userId, amount) {
    if (amount <= 0)
        throw new Error('Credit amount must be positive');
    // Upsert to handle first-time wallet creation inside transaction
    const wallet = await tx.wallet.upsert({
        where: { userId },
        update: {
            balance: { increment: amount },
            updatedAt: new Date(),
        },
        create: {
            userId,
            balance: amount,
            updatedAt: new Date(),
        },
    });
    return wallet.balance;
}
/**
 * Debit (subtract from) a wallet. Used for report unlocks.
 * MUST be called inside a Prisma interactive transaction.
 * The DB CHECK(balance >= 0) will throw if insufficient funds.
 *
 * @param tx - Prisma transaction client
 * @param userId - User to debit
 * @param amount - Positive integer credits to deduct
 * @returns New balance after debit
 * @throws If balance insufficient (Prisma/DB constraint error)
 */
async function debitWallet(tx, userId, amount) {
    if (amount <= 0)
        throw new Error('Debit amount must be positive');
    const wallet = await tx.wallet.update({
        where: { userId },
        data: {
            balance: { decrement: amount },
            updatedAt: new Date(),
        },
    });
    return wallet.balance;
}
/**
 * Admin: set wallet balance directly. Use with caution.
 */
async function setBalance(tx, userId, newBalance) {
    if (newBalance < 0)
        throw new Error('Balance cannot be negative');
    const wallet = await tx.wallet.upsert({
        where: { userId },
        update: {
            balance: newBalance,
            updatedAt: new Date(),
        },
        create: {
            userId,
            balance: newBalance,
            updatedAt: new Date(),
        },
    });
    return wallet.balance;
}
