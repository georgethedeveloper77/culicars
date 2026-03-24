"use strict";
// apps/api/src/services/enrichmentService.ts
//
// Applies approved contributions to the live vehicle record.
// Called by contributionService.moderate() when status → 'approved'.
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyContribution = applyContribution;
const prisma_1 = __importDefault(require("../lib/prisma"));
/**
 * Apply an approved contribution to the vehicle record and events table.
 * This is deliberately conservative — we only write things we can trust.
 */
async function applyContribution(contribution) {
    const { vin, type, data } = contribution;
    const confidence = contribution.confidenceScore ?? 0.4;
    switch (type) {
        case 'MILEAGE_RECORD':
            await applyMileageRecord(vin, data, confidence);
            break;
        case 'DAMAGE_REPORT':
            await applyDamageReport(vin, data, confidence);
            break;
        case 'SERVICE_RECORD':
            await applyServiceRecord(vin, contribution, confidence);
            break;
        case 'OWNERSHIP_TRANSFER':
            await applyOwnershipTransfer(vin, data, confidence);
            break;
        case 'INSPECTION_RECORD':
            await applyInspectionRecord(vin, data, confidence);
            break;
        case 'IMPORT_DOCUMENT':
            await applyImportDocument(vin, data, confidence);
            break;
        case 'THEFT_REPORT':
            // Theft contributions are advisory only; use stolenReportService for formal reports
            await applyGenericEvent(vin, 'STOLEN', data, confidence, contribution.id);
            break;
        case 'LISTING_PROOF':
            await applyGenericEvent(vin, 'LISTED_FOR_SALE', data, confidence, contribution.id);
            break;
        case 'PHOTO_EVIDENCE':
        case 'GENERAL_NOTE':
            // No vehicle record changes — metadata only, surfaced in report
            await applyGenericEvent(vin, 'CONTRIBUTION_ADDED', data, confidence, contribution.id);
            break;
        default:
            break;
    }
    // After enrichment, mark existing reports as stale so they regenerate
    await prisma_1.default.report.updateMany({
        where: { vin },
        data: { status: 'stale' },
    });
}
// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------
async function applyMileageRecord(vin, data, confidence) {
    if (!data?.mileage || !data?.date)
        return;
    await prisma_1.default.vehicleEvent.create({
        data: {
            vin,
            eventType: 'SERVICED', // Mileage records often come from service visits
            eventDate: new Date(data.date),
            source: 'contribution',
            confidence,
            metadata: { mileage: data.mileage, source: 'contribution' },
        },
    });
}
async function applyDamageReport(vin, data, confidence) {
    await prisma_1.default.vehicleEvent.create({
        data: {
            vin,
            eventType: 'DAMAGED',
            eventDate: data?.date ? new Date(data.date) : new Date(),
            county: data?.county ?? null,
            source: 'contribution',
            confidence,
            metadata: (data ?? {}),
        },
    });
}
async function applyServiceRecord(vin, contribution, confidence) {
    const data = contribution.data;
    await prisma_1.default.vehicleEvent.create({
        data: {
            vin,
            eventType: 'SERVICED',
            eventDate: data?.date ? new Date(data.date) : new Date(),
            county: data?.county ?? null,
            source: 'contribution',
            confidence,
            metadata: ({
                garageName: data?.garageName,
                mileage: data?.mileage,
                workDone: contribution.description,
                ...data,
            }),
        },
    });
}
async function applyOwnershipTransfer(vin, data, confidence) {
    await prisma_1.default.vehicleEvent.create({
        data: {
            vin,
            eventType: 'OWNERSHIP_CHANGE',
            eventDate: data?.date ? new Date(data.date) : new Date(),
            source: 'contribution',
            confidence,
            metadata: (data ?? {}),
        },
    });
}
async function applyInspectionRecord(vin, data, confidence) {
    const eventType = data?.passed === false ? 'INSPECTION_FAILED' : 'INSPECTED';
    await prisma_1.default.vehicleEvent.create({
        data: {
            vin,
            eventType: eventType,
            eventDate: data?.date ? new Date(data.date) : new Date(),
            county: data?.county ?? null,
            source: 'contribution',
            confidence,
            metadata: (data ?? {}),
        },
    });
}
async function applyImportDocument(vin, data, confidence) {
    await prisma_1.default.vehicleEvent.create({
        data: {
            vin,
            eventType: 'IMPORTED',
            eventDate: data?.importDate ? new Date(data.importDate) : new Date(),
            source: 'contribution',
            confidence,
            metadata: (data ?? {}),
        },
    });
}
async function applyGenericEvent(vin, eventType, data, confidence, sourceRef) {
    await prisma_1.default.vehicleEvent.create({
        data: {
            vin,
            eventType: eventType,
            eventDate: new Date(),
            source: 'contribution',
            sourceRef: sourceRef,
            confidence,
            metadata: (data ?? {}),
        },
    });
}
