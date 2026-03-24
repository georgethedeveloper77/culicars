"use strict";
// ============================================================
// CuliCars — Thread 6: Ledger Service
// ============================================================
// APPEND ONLY. Never UPDATE or DELETE rows in credit_ledger.
// Every credit mutation gets a ledger entry with balance snapshot.
// ============================================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.appendEntry = appendEntry;
exports.getUserLedger = getUserLedger;
exports.getEntryByTxRef = getEntryByTxRef;
const prisma_1 = __importDefault(require("../lib/prisma"));
/**
 * Append a single ledger entry. Called inside a transaction.
 * NEVER updates or deletes existing entries.
 */
async function appendEntry(tx, input) {
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
            metadata: (input.metadata ?? undefined),
        },
    });
}
/**
 * Get paginated ledger history for a user.
 * Most recent first.
 */
async function getUserLedger(userId, options = {}) {
    const { limit = 50, offset = 0 } = options;
    const [entries, total] = await Promise.all([
        prisma_1.default.creditLedger.findMany({
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
        prisma_1.default.creditLedger.count({ where: { userId } }),
    ]);
    return { entries, total, limit, offset };
}
/**
 * Get a single ledger entry by txRef (for idempotency checks).
 */
async function getEntryByTxRef(txRef) {
    return prisma_1.default.creditLedger.findFirst({
        where: { txRef },
    });
}
