"use strict";
// ============================================================
// CuliCars — Section Builder: DAMAGE (LOCKED)
// 3D car diagram location + severity + KES cost range
// ============================================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildDamageSection = buildDamageSection;
const prisma_1 = __importDefault(require("../../lib/prisma"));
// Location codes for 3D car diagram positioning
const DAMAGE_LOCATIONS = {
    front_left_fender: 'Front left / Fender',
    front_right_fender: 'Front right / Fender',
    front_bumper: 'Front / Bumper',
    front_hood: 'Front / Hood',
    front_left_light: 'Front left / Headlight',
    front_right_light: 'Front right / Headlight',
    front_windshield: 'Front / Windshield',
    left_door_front: 'Left / Front door',
    left_door_rear: 'Left / Rear door',
    right_door_front: 'Right / Front door',
    right_door_rear: 'Right / Rear door',
    left_mirror: 'Left / Mirror',
    right_mirror: 'Right / Mirror',
    left_sill: 'Left / Sill panel',
    right_sill: 'Right / Sill panel',
    roof: 'Exterior / Roof',
    rear_bumper: 'Rear / Bumper',
    rear_trunk: 'Rear / Trunk lid',
    rear_left_light: 'Rear left / Tail light',
    rear_right_light: 'Rear right / Tail light',
    rear_windshield: 'Rear / Windshield',
    undercarriage: 'Undercarriage',
    left_quarter: 'Left / Quarter panel',
    right_quarter: 'Right / Quarter panel',
};
// Typical repair cost ranges in KES by severity and location
function estimateRepairCost(severity, _locationCode) {
    if (severity === 'severe') {
        return { min: 100000, max: 500000 };
    }
    return { min: 20000, max: 150000 };
}
async function buildDamageSection(vin) {
    const damageEvents = await prisma_1.default.vehicleEvent.findMany({
        where: {
            vin,
            eventType: 'DAMAGED',
        },
        select: {
            id: true,
            eventDate: true,
            county: true,
            source: true,
            metadata: true,
        },
        orderBy: { eventDate: 'desc' },
    });
    const incidents = damageEvents.map((event) => {
        const meta = event.metadata;
        const locationCode = meta?.locationCode || 'front_bumper';
        const severity = meta?.severity === 'severe' ? 'severe' : 'damage';
        const location = DAMAGE_LOCATIONS[locationCode] || locationCode;
        const cost = estimateRepairCost(severity, locationCode);
        return {
            id: event.id,
            location,
            locationCode,
            severity,
            repairCostMin: meta?.repairCostMin || cost.min,
            repairCostMax: meta?.repairCostMax || cost.max,
            date: event.eventDate.toISOString().split('T')[0],
            county: event.county ?? undefined,
            possibleCause: meta?.cause || 'Unknown',
            source: event.source ?? 'unknown',
            structuralWarning: severity === 'severe' || meta?.structural === true,
        };
    });
    const hasSevereDamage = incidents.some((i) => i.severity === 'severe');
    const hasStructuralDamage = incidents.some((i) => i.structuralWarning);
    // Diagram location dots
    const diagramLocations = incidents.map((i) => ({
        code: i.locationCode,
        severity: i.severity,
        label: i.location,
    }));
    return {
        data: {
            incidents,
            totalIncidents: incidents.length,
            hasSevereDamage,
            hasStructuralDamage,
            diagramLocations,
        },
        recordCount: incidents.length,
        dataStatus: incidents.length > 0 ? 'found' : 'not_found',
    };
}
