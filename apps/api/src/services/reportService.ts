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
  const existing = await prisma.reports.findFirst({
    where: { vin, status: 'ready' },
    select: { id: true },
  });

  if (existing) {
    // Verify it has sections — if not, regenerate
    const sectionCount = await prisma.report_sections.count({ where: { report_id: existing.id } });
    if (sectionCount > 0) return existing.id;
  }

  // Check for stale — regenerate
  const stale = await prisma.reports.findFirst({
    where: { vin, status: 'stale' },
    select: { id: true },
  });

  if (stale) {
    const r = await generateReport(vin);
    return r.id;
  }

  // No report at all — generate new
  const r = await generateReport(vin);
  return r.id;
}

/**
 * Get a report preview — summary without full section data.
 * Used for search results and report cover.
 */
export async function getReportPreview(
  reportId: string,
  userId?: string
): Promise<ReportPreview | null> {
  const report = await prisma.reports.findUnique({
    where: { id: reportId },
    include: {
      sections: {
        select: {
          section_type: true,
          is_locked: true,
          data_status: true,
          record_count: true,
        },
      },
    },
  });

  if (!report) return null;

  // Get vehicle info
  const vehicle = await prisma.vehicles.findUnique({
    where: { vin: report.vin },
    select: {
      make: true,
      model: true,
      year: true,
      color: true,
      body_type: true,
    },
  });

  // Get plates
  const plates = await prisma.plate_vin_map.findMany({
    where: { vin: report.vin },
    select: { plate: true, plate_display: true },
    orderBy: { confidence: 'desc' },
  });

  // Stolen alert
  const stolenCount = await prisma.stolen_reports.count({
    where: { vin: report.vin, status: 'active' },
  });

  // Check if user has unlocked
  let isUnlocked = false;
  if (userId) {
    const unlock = await prisma.report_unlock.findUnique({
      where: {
        userId_report_id: { userId, reportId },
      },
    });
    isUnlocked = !!unlock;
  }

  // Adjust locked status if user has unlocked
  const sectionSummary = (report.report_sections ?? []).map((s) => ({
    section_type: s.section_type as SectionType,
    is_locked: isUnlocked ? false : s.is_locked ?? true,
    data_status: s.data_status as 'found' | 'not_found' | 'not_checked',
    record_count: s.record_count ?? 0,
  }));

  return {
    id: report.id,
    vin: report.vin,
    status: report.status ?? 'draft',
    risk_score: report.risk_score,
    risk_level: report.risk_level as ReportPreview['riskLevel'],
    recommendation: report.recommendation as ReportPreview['recommendation'],
    sources_checked: report.sources_checked ?? 0,
    records_found: report.records_found ?? 0,
    generated_at: report.generated_at?.toISOString() ?? null,
    vehicle: {
      make: vehicle?.make ?? null,
      model: vehicle?.model ?? null,
      year: vehicle?.year ?? null,
      color: vehicle?.color ?? null,
      body_type: vehicle?.body_type ?? null,
    },
    plates: plates.map((p) => ({
      plate: p.plate,
      plate_display: p.plate_display ?? p.plate,
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
    const unlock = await prisma.report_unlock.findUnique({
      where: {
        userId_report_id: { userId, reportId },
      },
    });
    isUnlocked = !!unlock;
  }

  // Get all sections with data
  const dbSections = await prisma.report_sections.findMany({
    where: { report_id: reportId },
    orderBy: { id: 'asc' },
  });

  const sections: ReportSection[] = dbSections.map((s) => {
    const sectionType = s.section_type as SectionType;
    const isFree = FREE_SECTIONS.includes(sectionType);
    const locked = !isFree && !isUnlocked && s.is_locked;

    return {
      id: s.id,
      sectionType,
      data: locked ? null : (s.data as ReportSection['data']),
      is_locked: locked ?? true,
      record_count: s.record_count ?? 0,
      data_status: s.data_status as 'found' | 'not_found' | 'not_checked',
    };
  });

  return {
    ...preview,
    sections,
  };
}
