// ============================================================
// CuliCars — Thread 5: Report Service
// Get by VIN (auto-generate if needed), get by ID, preview
// ============================================================

import prisma from '../lib/prisma';
import { generateReport } from './reportGenerator';
import { FREE_SECTIONS, type SectionType } from '../types/report.types';
import type { FullReport, ReportPreview, ReportSection } from '../types/report.types';

/**
 * Get or generate a report by VIN.
 * If no report exists or it's stale, generate a fresh one.
 * Returns the report ID.
 */
export async function getOrGenerateByVin(vin: string): Promise<string> {
  // Check for existing ready report
  const existing = await prisma.report.findFirst({
    where: { vin, status: 'ready' },
    select: { id: true },
  });

  if (existing) {
    // Verify it has sections — if not, regenerate
    const sectionCount = await prisma.reportSection.count({ where: { reportId: existing.id } });
    if (sectionCount > 0) return existing.id;
  }

  // Check for stale — regenerate
  const stale = await prisma.report.findFirst({
    where: { vin, status: 'stale' },
    select: { id: true },
  });

  if (stale) {
    return generateReport(vin);
  }

  // No report at all — generate new
  return generateReport(vin);
}

/**
 * Get a report preview — summary without full section data.
 * Used for search results and report cover.
 */
export async function getReportPreview(
  reportId: string,
  userId?: string
): Promise<ReportPreview | null> {
  const report = await prisma.report.findUnique({
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

  if (!report) return null;

  // Get vehicle info
  const vehicle = await prisma.vehicle.findUnique({
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
  const plates = await prisma.plateVinMap.findMany({
    where: { vin: report.vin },
    select: { plate: true, plateDisplay: true },
    orderBy: { confidence: 'desc' },
  });

  // Stolen alert
  const stolenCount = await prisma.stolenReport.count({
    where: { vin: report.vin, status: 'active' },
  });

  // Check if user has unlocked
  let isUnlocked = false;
  if (userId) {
    const unlock = await prisma.reportUnlock.findUnique({
      where: {
        userId_reportId: { userId, reportId },
      },
    });
    isUnlocked = !!unlock;
  }

  // Adjust locked status if user has unlocked
  const sectionSummary = (report.sections ?? []).map((s) => ({
    sectionType: s.sectionType as SectionType,
    isLocked: isUnlocked ? false : s.isLocked,
    dataStatus: s.dataStatus as 'found' | 'not_found' | 'not_checked',
    recordCount: s.recordCount ?? 0,
  }));

  return {
    id: report.id,
    vin: report.vin,
    status: report.status ?? 'draft',
    riskScore: report.riskScore,
    riskLevel: report.riskLevel as ReportPreview['riskLevel'],
    recommendation: report.recommendation as ReportPreview['recommendation'],
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
export async function getFullReport(
  reportId: string,
  userId?: string
): Promise<FullReport | null> {
  const preview = await getReportPreview(reportId, userId);
  if (!preview) return null;

  // Check unlock status
  let isUnlocked = false;
  if (userId) {
    const unlock = await prisma.reportUnlock.findUnique({
      where: {
        userId_reportId: { userId, reportId },
      },
    });
    isUnlocked = !!unlock;
  }

  // Get all sections with data
  const dbSections = await prisma.reportSection.findMany({
    where: { reportId },
    orderBy: { id: 'asc' },
  });

  const sections: ReportSection[] = dbSections.map((s) => {
    const sectionType = s.sectionType as SectionType;
    const isFree = FREE_SECTIONS.includes(sectionType);
    const locked = !isFree && !isUnlocked && s.isLocked;

    return {
      id: s.id,
      sectionType,
      data: locked ? null : (s.data as ReportSection['data']),
      isLocked: locked,
      recordCount: s.recordCount ?? 0,
      dataStatus: s.dataStatus as 'found' | 'not_found' | 'not_checked',
    };
  });

  return {
    ...preview,
    sections,
  };
}
