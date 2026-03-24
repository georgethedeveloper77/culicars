"use strict";
// ============================================================
// CuliCars — Section Builder: SERVICE (LOCKED)
// Service records from Auto Express, Peach Cars, contributions
// ============================================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildServiceSection = buildServiceSection;
const prisma_1 = __importDefault(require("../../lib/prisma"));
async function buildServiceSection(vin) {
    const serviceEvents = await prisma_1.default.vehicleEvent.findMany({
        where: {
            vin,
            eventType: 'SERVICED',
        },
        select: {
            eventDate: true,
            county: true,
            source: true,
            metadata: true,
        },
        orderBy: { eventDate: 'desc' },
    });
    const entries = serviceEvents.map((event) => {
        const meta = event.metadata;
        return {
            date: event.eventDate.toISOString().split('T')[0],
            garageName: meta?.garageName || 'Unknown garage',
            county: event.county ?? undefined,
            mileage: meta?.mileage || undefined,
            workDone: meta?.workDone || meta?.description || 'Service performed',
            workTypes: Array.isArray(meta?.workTypes)
                ? meta.workTypes
                : [],
            source: event.source ?? 'unknown',
        };
    });
    // Service records with mileage help verify odometer
    const mileageVerification = entries.some((e) => e.mileage && e.mileage > 0);
    return {
        data: {
            entries,
            totalServices: entries.length,
            lastServiceDate: entries.length > 0 ? entries[0].date : null,
            mileageVerification,
        },
        recordCount: entries.length,
        dataStatus: entries.length > 0 ? 'found' : 'not_found',
    };
}
