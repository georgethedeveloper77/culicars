// ============================================================
// CuliCars — Section Builder: STOLEN_REPORTS (FREE)
// Community-submitted stolen vehicle reports
// ============================================================

import prisma from '../../lib/prisma';
import type { StolenReportsSectionData } from '../../types/report.types';

export async function buildStolenReportsSection(vin: string): Promise<{
  data: StolenReportsSectionData;
  record_count: number;
  data_status: 'found' | 'not_found' | 'not_checked';
}> {
  // Get all non-rejected stolen reports for this VIN
  const reports = await prisma.stolen_reports.findMany({
    where: {
      vin,
      status: { not: 'rejected' },
    },
    select: {
      date_stolen: true,
      county_stolen: true,
      town_stolen: true,
      police_ob_number: true,
      is_ob_verified: true,
      status: true,
      car_color: true,
      recovery_date: true,
      created_at: true,
    },
    orderBy: { date_stolen: 'desc' },
  });

  // Also check by plate — a stolen report might only have plate, not VIN
  const plates = await prisma.plate_vin_map.findMany({
    where: { vin },
    select: { plate: true },
  });

  const plateValues = plates.map((p) => p.plate);

  let plateReports: typeof reports = [];
  if (plateValues.length > 0) {
    plateReports = await prisma.stolen_reports.findMany({
      where: {
        plate: { in: plateValues },
        vin: null, // Only those without VIN (to avoid duplicates)
        status: { not: 'rejected' },
      },
      select: {
        date_stolen: true,
        county_stolen: true,
        town_stolen: true,
        police_ob_number: true,
        is_ob_verified: true,
        status: true,
        car_color: true,
        recovery_date: true,
        created_at: true,
      },
      orderBy: { date_stolen: 'desc' },
    });
  }

  const allReports = [...reports, ...plateReports];
  const hasActiveReport = allReports.some((r) => r.status === 'active');

  const mappedReports = allReports.map((r) => ({
    date_stolen: r.date_stolen.toISOString().split('T')[0],
    county: r.county_stolen,
    town: r.town_stolen,
    obNumber: r.police_ob_number,
    is_ob_verified: r.is_ob_verified ?? false,
    status: r.status ?? 'pending',
    car_color: r.car_color ?? 'unknown',
    recovery_date: r.recovery_date
      ? r.recovery_date.toISOString().split('T')[0]
      : null,
    reportedAt: r.created_at?.toISOString() ?? '',
  }));

  return {
    data: {
      hasActiveReport,
      totalReports: mappedReports.length,
      reports: mappedReports,
    },
    record_count: mappedReports.length,
    data_status: mappedReports.length > 0 ? 'found' : 'not_found',
  };
}
