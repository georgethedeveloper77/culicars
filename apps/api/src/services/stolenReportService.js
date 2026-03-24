"use strict";
// apps/api/src/services/stolenReportService.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitReport = submitReport;
exports.getByPlate = getByPlate;
exports.getByVin = getByVin;
exports.getById = getById;
exports.reviewReport = reviewReport;
exports.markRecovered = markRecovered;
const prisma_1 = __importDefault(require("../lib/prisma"));
// ---------------------------------------------------------------------------
// Submit (public — no auth required)
// ---------------------------------------------------------------------------
async function submitReport(submission, userId) {
    const plate = normalisePlate(submission.plate);
    const plateDisplay = formatPlateDisplay(plate);
    // Check for recent duplicate (same plate, submitted in last 24h, still pending/active)
    const recentDuplicate = await prisma_1.default.stolenReport.findFirst({
        where: {
            plate,
            status: { in: ['pending', 'active'] },
            createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
    });
    if (recentDuplicate) {
        throw Object.assign(new Error('A report for this vehicle was recently submitted and is under review'), { status: 409 });
    }
    const record = await prisma_1.default.stolenReport.create({
        data: {
            plate,
            plateDisplay: plateDisplay,
            vin: submission.vin ?? null,
            reporterUserId: userId,
            reporterType: submission.reporterType,
            dateStolen: new Date(submission.dateStolenIso),
            countyStolen: submission.countyStolen,
            townStolen: submission.townStolen,
            policeObNumber: submission.policeObNumber ?? null,
            policeStation: submission.policeStation ?? null,
            carColor: submission.carColor,
            identifyingMarks: submission.identifyingMarks ?? null,
            photoUrls: submission.photoUrls ?? [],
            contactPhone: submission.contactPhone ?? null,
            contactEmail: submission.contactEmail ?? null,
            status: 'pending',
            isObVerified: false,
        },
    });
    return mapReport(record);
}
// ---------------------------------------------------------------------------
// Get by plate (public — FREE)
// ---------------------------------------------------------------------------
async function getByPlate(plate) {
    const rows = await prisma_1.default.stolenReport.findMany({
        where: { plate: normalisePlate(plate) },
        orderBy: { createdAt: 'desc' },
    });
    return rows.map(mapReport);
}
// ---------------------------------------------------------------------------
// Get by VIN (public — FREE)
// ---------------------------------------------------------------------------
async function getByVin(vin) {
    const rows = await prisma_1.default.stolenReport.findMany({
        where: { vin },
        orderBy: { createdAt: 'desc' },
    });
    return rows.map(mapReport);
}
// ---------------------------------------------------------------------------
// Get single
// ---------------------------------------------------------------------------
async function getById(id) {
    const row = await prisma_1.default.stolenReport.findUnique({ where: { id } });
    return row ? mapReport(row) : null;
}
// ---------------------------------------------------------------------------
// Admin review
// ---------------------------------------------------------------------------
async function reviewReport(id, review, adminUserId) {
    const existing = await prisma_1.default.stolenReport.findUnique({ where: { id } });
    if (!existing) {
        throw Object.assign(new Error('Report not found'), { status: 404 });
    }
    const updated = await prisma_1.default.stolenReport.update({
        where: { id },
        data: {
            status: review.status,
            adminNote: review.adminNote ?? null,
            isObVerified: review.isObVerified ?? false,
            reviewedBy: adminUserId,
            reviewedAt: new Date(),
        },
    });
    if (review.status === 'active') {
        await handleApproval(updated);
    }
    return mapReport(updated);
}
// ---------------------------------------------------------------------------
// Mark recovered (owner self-service)
// ---------------------------------------------------------------------------
async function markRecovered(id, recovery, userId) {
    const existing = await prisma_1.default.stolenReport.findUnique({ where: { id } });
    if (!existing) {
        throw Object.assign(new Error('Report not found'), { status: 404 });
    }
    if (existing.status !== 'active') {
        throw Object.assign(new Error('Only active reports can be marked as recovered'), {
            status: 400,
        });
    }
    // Only the original reporter or an admin can mark recovered
    if (userId && existing.reporterUserId && existing.reporterUserId !== userId) {
        throw Object.assign(new Error('Unauthorized'), { status: 403 });
    }
    const updated = await prisma_1.default.stolenReport.update({
        where: { id },
        data: {
            status: 'recovered',
            recoveryDate: new Date(recovery.recoveryDate),
            recoveryCounty: recovery.recoveryCounty,
            recoveryNotes: recovery.recoveryNotes ?? null,
        },
    });
    // Add RECOVERED event to vehicle timeline
    if (updated.vin) {
        await prisma_1.default.vehicleEvent.create({
            data: {
                vin: updated.vin,
                eventType: 'RECOVERED',
                eventDate: new Date(recovery.recoveryDate),
                county: recovery.recoveryCounty,
                source: 'community_stolen_report',
                sourceRef: id,
                confidence: 0.7,
                metadata: ({
                    stolenReportId: id,
                    recoveryNotes: recovery.recoveryNotes,
                }),
            },
        });
        // Mark reports stale so theft section regenerates
        await prisma_1.default.report.updateMany({
            where: { vin: updated.vin },
            data: { status: 'stale' },
        });
    }
    return mapReport(updated);
}
// ---------------------------------------------------------------------------
// Approval side-effects
// ---------------------------------------------------------------------------
async function handleApproval(report) {
    const vin = report['vin'];
    const plate = report['plate'];
    const dateStolenRaw = report['dateStolen'];
    const dateStolenDate = dateStolenRaw instanceof Date ? dateStolenRaw : new Date(dateStolenRaw);
    const county = report['countyStolen'];
    const stolenReportId = report['id'];
    let resolvedVin = vin;
    // If no VIN provided, try to resolve from plate_vin_map
    if (!resolvedVin) {
        const mapping = await prisma_1.default.plateVinMap.findFirst({
            where: { plate },
            orderBy: { confidence: 'desc' },
        });
        resolvedVin = mapping?.vin ?? null;
    }
    if (resolvedVin) {
        // Ensure vehicle exists — it may have been added by other sources
        const vehicle = await prisma_1.default.vehicle.findUnique({ where: { vin: resolvedVin } });
        if (!vehicle) {
            // Create minimal vehicle record from stolen report data
            await prisma_1.default.vehicle.create({
                data: {
                    vin: resolvedVin,
                    color: report['carColor'],
                },
            });
            // Create plate-VIN mapping if VIN was user-provided
            if (vin) {
                await prisma_1.default.plateVinMap.upsert({
                    where: { id: `${plate}-${resolvedVin}` },
                    create: {
                        plate,
                        plateDisplay: formatPlateDisplay(plate),
                        vin: resolvedVin,
                        confidence: 0.4,
                        source: 'contribution',
                    },
                    update: {},
                });
            }
        }
        // Insert STOLEN vehicle event
        await prisma_1.default.vehicleEvent.create({
            data: {
                vin: resolvedVin,
                eventType: 'STOLEN',
                eventDate: dateStolenDate,
                county,
                source: 'community_stolen_report',
                sourceRef: stolenReportId,
                confidence: 0.8,
                metadata: ({
                    stolenReportId,
                    policeObNumber: report['policeObNumber'],
                    isObVerified: report['isObVerified'],
                    carColor: report['carColor'],
                }),
            },
        });
        // Mark all existing reports stale → risk score recalculates to CRITICAL
        await prisma_1.default.report.updateMany({
            where: { vin: resolvedVin },
            data: { status: 'stale' },
        });
    }
}
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function normalisePlate(plate) {
    return plate.toUpperCase().replace(/\s+/g, '');
}
function formatPlateDisplay(normalised) {
    // KCA123A → KCA 123A (standard post-2004 format)
    const match = normalised.match(/^([A-Z]{3})(\d{3})([A-Z])$/);
    if (match)
        return `${match[1]} ${match[2]}${match[3]}`;
    // KCA123 → KCA 123 (older private)
    const old = normalised.match(/^([A-Z]{3})(\d{3})$/);
    if (old)
        return `${old[1]} ${old[2]}`;
    return normalised;
}
function mapReport(row) {
    return {
        id: row['id'],
        plate: row['plate'],
        plateDisplay: row['plateDisplay'] ?? null,
        vin: row['vin'] ?? null,
        reporterUserId: row['reporterUserId'] ?? null,
        reporterType: row['reporterType'],
        dateStolenIso: row['dateStolen'] instanceof Date
            ? row['dateStolen'].toISOString().split('T')[0]
            : row['dateStolen'],
        countyStolen: row['countyStolen'],
        townStolen: row['townStolen'],
        policeObNumber: row['policeObNumber'] ?? null,
        policeStation: row['policeStation'] ?? null,
        carColor: row['carColor'],
        identifyingMarks: row['identifyingMarks'] ?? null,
        photoUrls: row['photoUrls'] ?? [],
        contactPhone: row['contactPhone'] ?? null,
        contactEmail: row['contactEmail'] ?? null,
        status: row['status'],
        isObVerified: Boolean(row['isObVerified']),
        adminNote: row['adminNote'] ?? null,
        reviewedBy: row['reviewedBy'] ?? null,
        reviewedAt: row['reviewedAt'] ? new Date(row['reviewedAt']) : null,
        recoveryDate: row['recoveryDate'] instanceof Date
            ? row['recoveryDate'].toISOString().split('T')[0]
            : (row['recoveryDate'] ?? null),
        recoveryCounty: row['recoveryCounty'] ?? null,
        recoveryNotes: row['recoveryNotes'] ?? null,
        createdAt: new Date(row['createdAt']),
    };
}
