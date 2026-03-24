// ============================================================
// CuliCars — Thread 5: Report Generator
// Orchestrates all 13 section builders + risk scoring
// Creates/updates report + report_sections in the DB
// ============================================================

import prisma from '../lib/prisma';
import { scoreRisk } from './riskScorer';
import { FREE_SECTIONS, type SectionType } from '../types/report.types';

// Section builders
import { buildIdentitySection } from './sectionBuilders/identitySection';
import { buildPurposeSection } from './sectionBuilders/purposeSection';
import { buildTheftSection } from './sectionBuilders/theftSection';
import { buildOdometerSection } from './sectionBuilders/odometerSection';
import { buildLegalSection } from './sectionBuilders/legalSection';
import { buildDamageSection } from './sectionBuilders/damageSection';
import { buildSpecsEquipmentSection } from './sectionBuilders/specsEquipmentSection';
import { buildImportSection } from './sectionBuilders/importSection';
import { buildOwnershipSection } from './sectionBuilders/ownershipSection';
import { buildServiceSection } from './sectionBuilders/serviceSection';
import { buildPhotosSection } from './sectionBuilders/photosSection';
import { buildTimelineSection } from './sectionBuilders/timelineSection';
import { buildStolenReportsSection } from './sectionBuilders/stolenReportsSection';
import { buildRecommendationSection } from './sectionBuilders/recommendationSection';

interface SectionResult {
  sectionType: SectionType;
  data: unknown;
  recordCount: number;
  dataStatus: 'found' | 'not_found' | 'not_checked';
  isLocked: boolean;
}

/**
 * Generate (or regenerate) a full report for a VIN.
 * 1. Run all 13 section builders in parallel
 * 2. Score risk
 * 3. Build recommendation section from risk result
 * 4. Upsert report + report_sections in a transaction
 */
export async function generateReport(vin: string): Promise<string> {
  // Verify vehicle exists
  const vehicle = await prisma.vehicle.findUnique({
    where: { vin },
    select: { vin: true },
  });

  if (!vehicle) {
    throw new Error(`Vehicle not found: ${vin}`);
  }

  // Run all section builders in parallel (except recommendation — needs risk first)
  const [
    identity,
    purpose,
    theft,
    odometer,
    legal,
    damage,
    specsEquipment,
    importData,
    ownership,
    service,
    photos,
    timeline,
    stolenReports,
    riskResult,
  ] = await Promise.all([
    buildIdentitySection(vin),
    buildPurposeSection(vin),
    buildTheftSection(vin),
    buildOdometerSection(vin),
    buildLegalSection(vin),
    buildDamageSection(vin),
    buildSpecsEquipmentSection(vin),
    buildImportSection(vin),
    buildOwnershipSection(vin),
    buildServiceSection(vin),
    buildPhotosSection(vin),
    buildTimelineSection(vin),
    buildStolenReportsSection(vin),
    scoreRisk(vin),
  ]);

  // Build recommendation from risk result
  const recommendation = buildRecommendationSection(riskResult);

  // Assemble all sections
  const sections: SectionResult[] = [
    { sectionType: 'IDENTITY',        ...identity,      isLocked: false },
    { sectionType: 'PURPOSE',         ...purpose,       isLocked: true },
    { sectionType: 'THEFT',           ...theft,         isLocked: true },
    { sectionType: 'ODOMETER',        ...odometer,      isLocked: true },
    { sectionType: 'LEGAL',           ...legal,         isLocked: true },
    { sectionType: 'DAMAGE',          ...damage,        isLocked: true },
    { sectionType: 'SPECS_EQUIPMENT', ...specsEquipment, isLocked: false },
    { sectionType: 'IMPORT',          ...importData,    isLocked: true },
    { sectionType: 'OWNERSHIP',       ...ownership,     isLocked: true },
    { sectionType: 'SERVICE',         ...service,       isLocked: true },
    { sectionType: 'PHOTOS',          ...photos,        isLocked: true },
    { sectionType: 'TIMELINE',        ...timeline,      isLocked: true },
    { sectionType: 'STOLEN_REPORTS',  ...stolenReports, isLocked: false },
    { sectionType: 'RECOMMENDATION',  ...recommendation, isLocked: true },
  ];

  // Count totals
  const sourcesChecked = sections.filter(
    (s) => s.dataStatus !== 'not_checked'
  ).length;
  const recordsFound = sections.reduce((sum, s) => sum + s.recordCount, 0);

  // Upsert report + sections in a transaction
  const reportId = await prisma.$transaction(async (tx) => {
    // Check for existing report
    const existing = await tx.report.findFirst({
      where: { vin },
      select: { id: true },
    });

    let reportId: string;

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
    } else {
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
        data: s.data as object,
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
export async function regenerateStaleReports(vin: string): Promise<void> {
  const staleReports = await prisma.report.findMany({
    where: { vin, status: 'stale' },
    select: { id: true },
  });

  if (staleReports.length > 0) {
    await generateReport(vin);
  }
}
