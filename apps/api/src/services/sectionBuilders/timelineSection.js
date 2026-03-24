"use strict";
// ============================================================
// CuliCars — Section Builder: TIMELINE (LOCKED)
// Chronological list of every known event in the vehicle's life
// ============================================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildTimelineSection = buildTimelineSection;
const prisma_1 = __importDefault(require("../../lib/prisma"));
// Human-readable event type labels
const EVENT_LABELS = {
    MANUFACTURED: 'Manufactured',
    REGISTERED: 'Registered',
    INSPECTED: 'Inspected',
    INSPECTION_FAILED: 'Inspection Failed',
    DAMAGED: 'Damaged',
    REPAIRED: 'Repaired',
    SERVICED: 'Serviced',
    STOLEN: 'Reported Stolen',
    RECOVERED: 'Recovered',
    WANTED: 'Wanted',
    IMPORTED: 'Imported',
    EXPORTED: 'Exported',
    KRA_CLEARED: 'KRA Cleared',
    OWNERSHIP_CHANGE: 'Ownership Change',
    PSV_LICENSED: 'PSV Licensed',
    PSV_REVOKED: 'PSV License Revoked',
    LISTED_FOR_SALE: 'Listed for Sale',
    SOLD: 'Sold',
    AUCTIONED: 'Auctioned',
    CONTRIBUTION_ADDED: 'Contribution Added',
    ADMIN_NOTE: 'Admin Note',
};
async function buildTimelineSection(vin) {
    const events = await prisma_1.default.vehicleEvent.findMany({
        where: { vin },
        select: {
            eventType: true,
            eventDate: true,
            country: true,
            county: true,
            source: true,
            sourceRef: true,
            metadata: true,
        },
        orderBy: { eventDate: 'asc' },
    });
    const timelineEvents = events.map((event) => {
        const meta = event.metadata;
        const description = meta?.description ||
            EVENT_LABELS[event.eventType] ||
            event.eventType;
        return {
            date: event.eventDate.toISOString().split('T')[0],
            eventType: EVENT_LABELS[event.eventType] || event.eventType,
            description,
            county: event.county ?? undefined,
            country: event.country ?? 'KE',
            source: event.source ?? 'unknown',
            sourceRef: event.sourceRef ?? undefined,
        };
    });
    return {
        data: {
            events: timelineEvents,
            totalEvents: timelineEvents.length,
            firstEvent: timelineEvents.length > 0 ? timelineEvents[0].date : null,
            lastEvent: timelineEvents.length > 0
                ? timelineEvents[timelineEvents.length - 1].date
                : null,
        },
        recordCount: timelineEvents.length,
        dataStatus: timelineEvents.length > 0 ? 'found' : 'not_found',
    };
}
