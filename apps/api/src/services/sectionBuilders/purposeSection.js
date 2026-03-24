"use strict";
// ============================================================
// CuliCars — Section Builder: PURPOSE (LOCKED)
// Was this vehicle used commercially? PSV/Taxi/Rental/etc.
// ============================================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildPurposeSection = buildPurposeSection;
const prisma_1 = __importDefault(require("../../lib/prisma"));
const PURPOSE_CHECKS = [
    { type: 'PSV', label: 'PSV / Matatu', eventType: 'PSV_LICENSED' },
    { type: 'Taxi', label: 'Taxi / Uber / Bolt', eventType: null },
    { type: 'Rental', label: 'Rental / Hire Car', eventType: null },
    { type: 'Transport', label: 'Transport / Lorry', eventType: null },
    { type: 'Police', label: 'Police / Government', eventType: null },
    { type: 'DrivingSchool', label: 'Driving School', eventType: null },
    { type: 'Ambulance', label: 'Ambulance / Medical', eventType: null },
];
async function buildPurposeSection(vin) {
    const [vehicle, psvEvents, allEvents] = await Promise.all([
        prisma_1.default.vehicle.findUnique({
            where: { vin },
            select: { psvLicensed: true },
        }),
        // PSV license events
        prisma_1.default.vehicleEvent.findMany({
            where: { vin, eventType: 'PSV_LICENSED' },
            select: { eventDate: true, source: true, metadata: true },
        }),
        // All events — check metadata for commercial use indicators
        prisma_1.default.vehicleEvent.findMany({
            where: { vin },
            select: { eventType: true, metadata: true, source: true },
        }),
    ]);
    const checks = PURPOSE_CHECKS.map((check) => {
        let found = false;
        let source;
        let details;
        if (check.type === 'PSV') {
            found = (vehicle?.psvLicensed ?? false) || psvEvents.length > 0;
            if (psvEvents.length > 0) {
                source = psvEvents[0].source ?? undefined;
                details = `PSV licensed — ${psvEvents.length} record(s) found`;
            }
        }
        else {
            // Check event metadata for commercial use indicators
            const commercialEvent = allEvents.find((e) => {
                const meta = e.metadata;
                return meta?.commercialUse === check.type ||
                    meta?.vehicleUse === check.type?.toLowerCase();
            });
            if (commercialEvent) {
                found = true;
                source = commercialEvent.source ?? undefined;
                details = `Record found in ${source}`;
            }
        }
        return {
            type: check.type,
            label: check.label,
            found,
            source,
            details,
        };
    });
    const hasCommercialHistory = checks.some((c) => c.found);
    const recordCount = checks.filter((c) => c.found).length;
    return {
        data: { checks, hasCommercialHistory },
        recordCount,
        dataStatus: recordCount > 0 ? 'found' : 'not_found',
    };
}
