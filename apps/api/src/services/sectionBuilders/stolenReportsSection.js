"use strict";
// ============================================================
// CuliCars — Section Builder: STOLEN_REPORTS (FREE)
// Community-submitted stolen vehicle reports
// ============================================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildStolenReportsSection = buildStolenReportsSection;
const prisma_1 = __importDefault(require("../../lib/prisma"));
async function buildStolenReportsSection(vin) {
    // Get all non-rejected stolen reports for this VIN
    const reports = await prisma_1.default.stolenReport.findMany({
        where: {
            vin,
            status: { not: 'rejected' },
        },
        select: {
            dateStolen: true,
            countyStolen: true,
            townStolen: true,
            policeObNumber: true,
            isObVerified: true,
            status: true,
            carColor: true,
            recoveryDate: true,
            createdAt: true,
        },
        orderBy: { dateStolen: 'desc' },
    });
    // Also check by plate — a stolen report might only have plate, not VIN
    const plates = await prisma_1.default.plateVinMap.findMany({
        where: { vin },
        select: { plate: true },
    });
    const plateValues = plates.map((p) => p.plate);
    let plateReports = [];
    if (plateValues.length > 0) {
        plateReports = await prisma_1.default.stolenReport.findMany({
            where: {
                plate: { in: plateValues },
                vin: null, // Only those without VIN (to avoid duplicates)
                status: { not: 'rejected' },
            },
            select: {
                dateStolen: true,
                countyStolen: true,
                townStolen: true,
                policeObNumber: true,
                isObVerified: true,
                status: true,
                carColor: true,
                recoveryDate: true,
                createdAt: true,
            },
            orderBy: { dateStolen: 'desc' },
        });
    }
    const allReports = [...reports, ...plateReports];
    const hasActiveReport = allReports.some((r) => r.status === 'active');
    const mappedReports = allReports.map((r) => ({
        dateStolen: r.dateStolen.toISOString().split('T')[0],
        county: r.countyStolen,
        town: r.townStolen,
        obNumber: r.policeObNumber,
        isObVerified: r.isObVerified ?? false,
        status: r.status ?? 'pending',
        carColor: r.carColor ?? 'unknown',
        recoveryDate: r.recoveryDate
            ? r.recoveryDate.toISOString().split('T')[0]
            : null,
        reportedAt: r.createdAt?.toISOString() ?? '',
    }));
    return {
        data: {
            hasActiveReport,
            totalReports: mappedReports.length,
            reports: mappedReports,
        },
        recordCount: mappedReports.length,
        dataStatus: mappedReports.length > 0 ? 'found' : 'not_found',
    };
}
