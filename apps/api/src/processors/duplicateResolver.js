"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isDuplicateEvent = isDuplicateEvent;
exports.filterDuplicateEvents = filterDuplicateEvents;
// apps/api/src/processors/duplicateResolver.ts
const prisma_1 = __importDefault(require("../lib/prisma"));
const DEDUP_WINDOW_DAYS = 30;
/**
 * Checks whether an event is a duplicate.
 * Duplicate = same VIN + same event_type + event_date within ±30 days + same source_ref.
 */
async function isDuplicateEvent(candidate) {
    const { vin, event_type, event_date, source_ref } = candidate;
    const windowStart = new Date(event_date);
    windowStart.setDate(windowStart.getDate() - DEDUP_WINDOW_DAYS);
    const windowEnd = new Date(event_date);
    windowEnd.setDate(windowEnd.getDate() + DEDUP_WINDOW_DAYS);
    const where = {
        vin,
        event_type,
        event_date: {
            gte: windowStart,
            lte: windowEnd,
        },
    };
    // Only filter by source_ref if provided — null source_ref matches any
    if (source_ref) {
        where.source_ref = source_ref;
    }
    const existing = await prisma_1.default.vehicleEvent.findFirst({ where });
    return existing !== null;
}
/**
 * Filters a batch of event candidates, returning only non-duplicates.
 */
async function filterDuplicateEvents(candidates) {
    const results = [];
    for (const candidate of candidates) {
        const isDupe = await isDuplicateEvent(candidate);
        if (!isDupe) {
            results.push(candidate);
        }
    }
    return results;
}
