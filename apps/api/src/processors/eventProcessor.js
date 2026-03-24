"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.insertEvent = insertEvent;
exports.insertEvents = insertEvents;
// apps/api/src/processors/eventProcessor.ts
const prisma_1 = __importDefault(require("../lib/prisma"));
const duplicateResolver_1 = require("./duplicateResolver");
/**
 * Inserts a vehicle event after deduplication check.
 * Returns true if inserted, false if skipped as duplicate.
 */
async function insertEvent(data) {
    const isDupe = await (0, duplicateResolver_1.isDuplicateEvent)({
        vin: data.vin,
        event_type: data.eventType,
        event_date: data.eventDate,
        source_ref: data.source_ref,
    });
    if (isDupe)
        return false;
    await prisma_1.default.vehicleEvent.create({
        data: {
            vin: data.vin,
            eventType: data.eventType,
            eventDate: data.eventDate,
            country: data.country ?? 'KE',
            county: data.county ?? null,
            source: data.source,
            sourceRef: data.source_ref ?? null,
            confidence: data.confidence ?? 0.5,
            metadata: (data.metadata ?? {}),
        },
    });
    return true;
}
/**
 * Inserts multiple events, skipping duplicates.
 * Returns count of actually inserted events.
 */
async function insertEvents(events) {
    let inserted = 0;
    for (const event of events) {
        const ok = await insertEvent(event);
        if (ok)
            inserted++;
    }
    return inserted;
}
