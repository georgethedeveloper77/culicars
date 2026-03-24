"use strict";
// ============================================================
// CuliCars — Section Builder: ODOMETER (LOCKED)
// Mileage history, rollback detection, chart data
// ============================================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildOdometerSection = buildOdometerSection;
const prisma_1 = __importDefault(require("../../lib/prisma"));
const mileageAnalyzer_1 = require("@culicars/utils/mileageAnalyzer");
async function buildOdometerSection(vin) {
    const [vehicle, mileageEvents] = await Promise.all([
        prisma_1.default.vehicle.findUnique({
            where: { vin },
            select: {
                year: true,
                make: true,
                model: true,
                japanAuctionMileage: true,
            },
        }),
        // Events that may carry mileage in metadata
        prisma_1.default.vehicleEvent.findMany({
            where: {
                vin,
                eventType: {
                    in: [
                        'SERVICED',
                        'INSPECTED',
                        'LISTED_FOR_SALE',
                        'AUCTIONED',
                        'IMPORTED',
                        'CONTRIBUTION_ADDED',
                    ],
                },
            },
            select: {
                eventDate: true,
                source: true,
                metadata: true,
            },
            orderBy: { eventDate: 'asc' },
        }),
    ]);
    // Extract mileage readings from event metadata
    const entries = [];
    // Japan auction mileage (pre-export)
    if (vehicle?.japanAuctionMileage) {
        // Estimate export date as 1 year before current year if year known
        const exportYear = vehicle.year ? vehicle.year + 1 : new Date().getFullYear() - 5;
        entries.push({
            date: `${exportYear}-01-01`,
            mileage: vehicle.japanAuctionMileage,
            source: 'Japan Auction',
        });
    }
    // Mileage from events
    for (const event of mileageEvents) {
        const meta = event.metadata;
        const mileage = meta?.mileage;
        if (mileage && mileage > 0) {
            entries.push({
                date: event.eventDate.toISOString().split('T')[0],
                mileage,
                source: event.source ?? 'unknown',
            });
        }
    }
    // Run analysis
    const analysis = (0, mileageAnalyzer_1.analyzeMileage)(entries);
    // Average for similar vehicles
    const similar = (0, mileageAnalyzer_1.estimateAverageForSimilar)(vehicle?.year ?? null, vehicle?.make ?? undefined, vehicle?.model ?? undefined);
    const data = {
        lastKnownMileage: analysis.lastKnownMileage,
        averageForSimilar: similar.average,
        similarDescription: similar.description,
        records: analysis.records.map((r) => ({
            date: r.date,
            mileage: r.mileage,
            source: r.source,
            isRollback: r.isRollback,
        })),
        rollbackDetected: analysis.rollbackDetected,
        rollbackCount: analysis.rollbackCount,
        chartData: analysis.chartData,
    };
    return {
        data,
        recordCount: entries.length,
        dataStatus: entries.length > 0 ? 'found' : 'not_found',
    };
}
