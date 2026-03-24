"use strict";
// ============================================================
// CuliCars — Thread 5: Report Service
// Get by VIN (auto-generate if needed), get by ID, preview
// ============================================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrGenerateByVin = getOrGenerateByVin;
exports.getReportPreview = getReportPreview;
exports.getFullReport = getFullReport;
const prisma_1 = __importDefault(require("../lib/prisma"));
const reportGenerator_1 = require("./reportGenerator");
const report_types_1 = require("../types/report.types");
/**
 * Get or generate a report by VIN.
 * If no report exists or it's stale, generate a fresh one.
 * Returns the report ID.
 */
async function getOrGenerateByVin(vin) {
    // Check for existing ready report
    const existing = await prisma_1.default.report.findFirst({
        where: { vin, status: 'ready' },
        select: { id: true },
    });
    if (existing) {
        // Verify it has sections — if not, regenerate
        const sectionCount = await prisma_1.default.reportSection.count({ where: { reportId: existing.id } });
        if (sectionCount > 0)
            return existing.id;
    }
    // Check for stale — regenerate
    const stale = await prisma_1.default.report.findFirst({
        where: { vin, status: 'stale' },
        select: { id: true },
    });
    if (stale) {
        return (0, reportGenerator_1.generateReport)(vin);
    }
    // No report at all — generate new
    return (0, reportGenerator_1.generateReport)(vin);
}
/**
 * Get a report preview — summary without full section data.
 * Used for search results and report cover.
 */
async function getReportPreview(reportId, userId) {
    const report = await prisma_1.default.report.findUnique({
        where: { id: reportId },
        include: {
            sections: {
                select: {
                    sectionType: true,
                    isLocked: true,
                    dataStatus: true,
                    recordCount: true,
                },
            },
        },
    });
    if (!report)
        return null;
    // Get vehicle info
    const vehicle = await prisma_1.default.vehicle.findUnique({
        where: { vin: report.vin },
        select: {
            make: true,
            model: true,
            year: true,
            color: true,
            bodyType: true,
        },
    });
    // Get plates
    const plates = await prisma_1.default.plateVinMap.findMany({
        where: { vin: report.vin },
        select: { plate: true, plateDisplay: true },
        orderBy: { confidence: 'desc' },
    });
    // Stolen alert
    const stolenCount = await prisma_1.default.stolenReport.count({
        where: { vin: report.vin, status: 'active' },
    });
    // Check if user has unlocked
    let isUnlocked = false;
    if (userId) {
        const unlock = await prisma_1.default.reportUnlock.findUnique({
            where: {
                userId_reportId: { userId, reportId },
            },
        });
        isUnlocked = !!unlock;
    }
    // Adjust locked status if user has unlocked
    const sectionSummary = (report.sections ?? []).map((s) => ({
        sectionType: s.sectionType,
        isLocked: isUnlocked ? false : s.isLocked,
        dataStatus: s.dataStatus,
        recordCount: s.recordCount ?? 0,
    }));
    return {
        id: report.id,
        vin: report.vin,
        status: report.status ?? 'draft',
        riskScore: report.riskScore,
        riskLevel: report.riskLevel,
        recommendation: report.recommendation,
        sourcesChecked: report.sourcesChecked ?? 0,
        recordsFound: report.recordsFound ?? 0,
        generatedAt: report.generatedAt?.toISOString() ?? null,
        vehicle: {
            make: vehicle?.make ?? null,
            model: vehicle?.model ?? null,
            year: vehicle?.year ?? null,
            color: vehicle?.color ?? null,
            bodyType: vehicle?.bodyType ?? null,
        },
        plates: plates.map((p) => ({
            plate: p.plate,
            plateDisplay: p.plateDisplay ?? p.plate,
        })),
        sectionSummary,
        stolenAlert: {
            active: stolenCount > 0,
            reportCount: stolenCount,
        },
    };
}
/**
 * Get full report with all section data.
 * Locked sections return data=null unless user has unlocked.
 */
async function getFullReport(reportId, userId) {
    const preview = await getReportPreview(reportId, userId);
    if (!preview)
        return null;
    // Check unlock status
    let isUnlocked = false;
    if (userId) {
        const unlock = await prisma_1.default.reportUnlock.findUnique({
            where: {
                userId_reportId: { userId, reportId },
            },
        });
        isUnlocked = !!unlock;
    }
    // Get all sections with data
    const dbSections = await prisma_1.default.reportSection.findMany({
        where: { reportId },
        orderBy: { id: 'asc' },
    });
    const sections = dbSections.map((s) => {
        const sectionType = s.sectionType;
        const isFree = report_types_1.FREE_SECTIONS.includes(sectionType);
        const locked = !isFree && !isUnlocked && s.isLocked;
        return {
            id: s.id,
            sectionType,
            data: locked ? null : s.data,
            isLocked: locked,
            recordCount: s.recordCount ?? 0,
            dataStatus: s.dataStatus,
        };
    });
    return {
        ...preview,
        sections,
    };
}
