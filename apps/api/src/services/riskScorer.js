"use strict";
// ============================================================
// CuliCars — Thread 5: Risk Scorer
// Queries DB for risk factors, delegates scoring to riskCalculator
// ============================================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scoreRisk = scoreRisk;
const prisma_1 = __importDefault(require("../lib/prisma"));
const riskCalculator_1 = require("@culicars/utils/riskCalculator");
/**
 * Gather all risk factors for a VIN from the database
 * and compute the risk score.
 */
async function scoreRisk(vin) {
    // Parallel queries for all risk factors
    const [vehicle, stolenReports, damageEvents, mileageEvents, ownershipEvents, purposeEvents,] = await Promise.all([
        prisma_1.default.vehicle.findUnique({
            where: { vin },
            select: {
                inspectionStatus: true,
                caveatStatus: true,
                psvLicensed: true,
                japanAuctionGrade: true,
                ntsaCorVerified: true,
            },
        }),
        // Active stolen reports
        prisma_1.default.stolenReport.count({
            where: { vin, status: 'active' },
        }),
        // Damage events (check for severe)
        prisma_1.default.vehicleEvent.findMany({
            where: {
                vin,
                eventType: { in: ['DAMAGED', 'REPAIRED'] },
            },
            select: { metadata: true },
        }),
        // Mileage-related events for rollback check
        prisma_1.default.vehicleEvent.findMany({
            where: {
                vin,
                eventType: { in: ['SERVICED', 'INSPECTED', 'LISTED_FOR_SALE', 'AUCTIONED'] },
            },
            select: { eventDate: true, metadata: true },
            orderBy: { eventDate: 'asc' },
        }),
        // Ownership changes
        prisma_1.default.vehicleEvent.count({
            where: { vin, eventType: 'OWNERSHIP_CHANGE' },
        }),
        // PSV/taxi events
        prisma_1.default.vehicleEvent.count({
            where: { vin, eventType: 'PSV_LICENSED' },
        }),
    ]);
    // Check for severe damage in metadata
    const hasSevereDamage = damageEvents.some((e) => {
        const meta = e.metadata;
        return meta?.severity === 'severe' || meta?.structural === true;
    });
    // Check for mileage rollback
    const mileageReadings = mileageEvents
        .map((e) => {
        const meta = e.metadata;
        const mileage = meta?.mileage;
        return mileage
            ? { date: e.eventDate.toISOString(), mileage, source: 'event' }
            : null;
    })
        .filter((r) => r !== null);
    let hasMileageRollback = false;
    if (mileageReadings.length >= 2) {
        let maxSoFar = 0;
        for (const r of mileageReadings) {
            if (r.mileage < maxSoFar - 500) {
                hasMileageRollback = true;
                break;
            }
            if (r.mileage > maxSoFar)
                maxSoFar = r.mileage;
        }
    }
    // Has finance caveat?
    const hasFinanceCaveat = vehicle?.caveatStatus === 'caveat';
    // Failed/expired inspection?
    const hasFailedInspection = vehicle?.inspectionStatus === 'failed' ||
        vehicle?.inspectionStatus === 'expired';
    // PSV/matatu history
    const hasPsvHistory = (vehicle?.psvLicensed ?? false) || purposeEvents > 0;
    // Has NTSA data?
    const hasNtsaData = vehicle?.ntsaCorVerified ?? false;
    const input = {
        hasStolenReport: stolenReports > 0,
        hasSevereDamage,
        hasMileageRollback,
        hasFinanceCaveat,
        hasFailedInspection,
        hasPsvHistory,
        ownershipChanges: ownershipEvents,
        japanAuctionGrade: vehicle?.japanAuctionGrade ?? null,
        hasNtsaData,
    };
    return (0, riskCalculator_1.calculateRisk)(input);
}
