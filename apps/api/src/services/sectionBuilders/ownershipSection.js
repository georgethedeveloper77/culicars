"use strict";
// ============================================================
// CuliCars — Section Builder: OWNERSHIP (LOCKED)
// Transfer count + ownership history
// ============================================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildOwnershipSection = buildOwnershipSection;
const prisma_1 = __importDefault(require("../../lib/prisma"));
async function buildOwnershipSection(vin) {
    const ownershipEvents = await prisma_1.default.vehicleEvent.findMany({
        where: {
            vin,
            eventType: 'OWNERSHIP_CHANGE',
        },
        select: {
            eventDate: true,
            county: true,
            source: true,
        },
        orderBy: { eventDate: 'asc' },
    });
    const transfers = ownershipEvents.map((e) => ({
        date: e.eventDate.toISOString().split('T')[0],
        county: e.county ?? undefined,
        source: e.source ?? 'unknown',
    }));
    const transferCount = transfers.length;
    const highTurnover = transferCount >= 4;
    return {
        data: {
            transferCount,
            transfers,
            highTurnover,
        },
        recordCount: transferCount,
        dataStatus: transferCount > 0 ? 'found' : 'not_found',
    };
}
