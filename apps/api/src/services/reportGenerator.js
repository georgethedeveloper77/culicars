"use strict";
// ============================================================
// CuliCars — Thread 5: Report Generator
// Orchestrates all 13 section builders + risk scoring
// Creates/updates report + report_sections in the DB
// ============================================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateReport = generateReport;
exports.regenerateStaleReports = regenerateStaleReports;
const prisma_1 = __importDefault(require("../lib/prisma"));
const riskScorer_1 = require("./riskScorer");
// Section builders
const identitySection_1 = require("./sectionBuilders/identitySection");
const purposeSection_1 = require("./sectionBuilders/purposeSection");
const theftSection_1 = require("./sectionBuilders/theftSection");
const odometerSection_1 = require("./sectionBuilders/odometerSection");
const legalSection_1 = require("./sectionBuilders/legalSection");
const damageSection_1 = require("./sectionBuilders/damageSection");
const specsEquipmentSection_1 = require("./sectionBuilders/specsEquipmentSection");
const importSection_1 = require("./sectionBuilders/importSection");
const ownershipSection_1 = require("./sectionBuilders/ownershipSection");
const serviceSection_1 = require("./sectionBuilders/serviceSection");
const photosSection_1 = require("./sectionBuilders/photosSection");
const timelineSection_1 = require("./sectionBuilders/timelineSection");
const stolenReportsSection_1 = require("./sectionBuilders/stolenReportsSection");
const recommendationSection_1 = require("./sectionBuilders/recommendationSection");
/**
 * Generate (or regenerate) a full report for a VIN.
 * 1. Run all 13 section builders in parallel
 * 2. Score risk
 * 3. Build recommendation section from risk result
 * 4. Upsert report + report_sections in a transaction
 */
async function generateReport(vin) {
    // Verify vehicle exists
    const vehicle = await prisma_1.default.vehicle.findUnique({
        where: { vin },
        select: { vin: true },
    });
    if (!vehicle) {
        throw new Error(`Vehicle not found: ${vin}`);
    }
    // Run all section builders in parallel (except recommendation — needs risk first)
    const [identity, purpose, theft, odometer, legal, damage, specsEquipment, importData, ownership, service, photos, timeline, stolenReports, riskResult,] = await Promise.all([
        (0, identitySection_1.buildIdentitySection)(vin),
        (0, purposeSection_1.buildPurposeSection)(vin),
        (0, theftSection_1.buildTheftSection)(vin),
        (0, odometerSection_1.buildOdometerSection)(vin),
        (0, legalSection_1.buildLegalSection)(vin),
        (0, damageSection_1.buildDamageSection)(vin),
        (0, specsEquipmentSection_1.buildSpecsEquipmentSection)(vin),
        (0, importSection_1.buildImportSection)(vin),
        (0, ownershipSection_1.buildOwnershipSection)(vin),
        (0, serviceSection_1.buildServiceSection)(vin),
        (0, photosSection_1.buildPhotosSection)(vin),
        (0, timelineSection_1.buildTimelineSection)(vin),
        (0, stolenReportsSection_1.buildStolenReportsSection)(vin),
        (0, riskScorer_1.scoreRisk)(vin),
    ]);
    // Build recommendation from risk result
    const recommendation = (0, recommendationSection_1.buildRecommendationSection)(riskResult);
    // Assemble all sections
    const sections = [
        { sectionType: 'IDENTITY', ...identity, isLocked: false },
        { sectionType: 'PURPOSE', ...purpose, isLocked: true },
        { sectionType: 'THEFT', ...theft, isLocked: true },
        { sectionType: 'ODOMETER', ...odometer, isLocked: true },
        { sectionType: 'LEGAL', ...legal, isLocked: true },
        { sectionType: 'DAMAGE', ...damage, isLocked: true },
        { sectionType: 'SPECS_EQUIPMENT', ...specsEquipment, isLocked: false },
        { sectionType: 'IMPORT', ...importData, isLocked: true },
        { sectionType: 'OWNERSHIP', ...ownership, isLocked: true },
        { sectionType: 'SERVICE', ...service, isLocked: true },
        { sectionType: 'PHOTOS', ...photos, isLocked: true },
        { sectionType: 'TIMELINE', ...timeline, isLocked: true },
        { sectionType: 'STOLEN_REPORTS', ...stolenReports, isLocked: false },
        { sectionType: 'RECOMMENDATION', ...recommendation, isLocked: true },
    ];
    // Count totals
    const sourcesChecked = sections.filter((s) => s.dataStatus !== 'not_checked').length;
    const recordsFound = sections.reduce((sum, s) => sum + s.recordCount, 0);
    // Upsert report + sections in a transaction
    const reportId = await prisma_1.default.$transaction(async (tx) => {
        // Check for existing report
        const existing = await tx.report.findFirst({
            where: { vin },
            select: { id: true },
        });
        let reportId;
        if (existing) {
            // Update existing report
            await tx.report.update({
                where: { id: existing.id },
                data: {
                    status: 'ready',
                    riskScore: riskResult.score,
                    riskLevel: riskResult.level,
                    recommendation: riskResult.recommendation,
                    sourcesChecked,
                    recordsFound,
                    generatedAt: new Date(),
                    updatedAt: new Date(),
                },
            });
            reportId = existing.id;
            // Delete old sections and recreate
            await tx.reportSection.deleteMany({
                where: { reportId },
            });
        }
        else {
            // Create new report
            const report = await tx.report.create({
                data: {
                    vin,
                    status: 'ready',
                    riskScore: riskResult.score,
                    riskLevel: riskResult.level,
                    recommendation: riskResult.recommendation,
                    sourcesChecked,
                    recordsFound,
                    generatedAt: new Date(),
                    updatedAt: new Date(),
                },
            });
            reportId = report.id;
        }
        // Create all sections
        await tx.reportSection.createMany({
            data: sections.map((s) => ({
                reportId,
                sectionType: s.sectionType,
                data: s.data,
                isLocked: s.isLocked,
                recordCount: s.recordCount,
                dataStatus: s.dataStatus,
                updatedAt: new Date(),
            })),
        });
        return reportId;
    });
    return reportId;
}
/**
 * Regenerate a report that has been marked stale.
 * Called when new data arrives (e.g., NTSA COR, stolen report approved).
 */
async function regenerateStaleReports(vin) {
    const staleReports = await prisma_1.default.report.findMany({
        where: { vin, status: 'stale' },
        select: { id: true },
    });
    if (staleReports.length > 0) {
        await generateReport(vin);
    }
}
