// ============================================================
// CuliCars — Section Builder: STOLEN_REPORTS (FREE)
// Community-submitted stolen vehicle reports
// ============================================================

import prisma from '../../lib/prisma';
import type { StolenReportsSectionData } from '../../types/report.types';

export async function buildStolenReportsSection(vin: string): Promise<{
  data: StolenReportsSectionData;
  recordCount: number;
  dataStatus: 'found' | 'not_found' | 'not_checked';
}> {
  // Get all non-rejected stolen reports for this VIN
  const reports = await prisma.stolenReport.findMany({
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
  const plates = await prisma.plateVinMap.findMany({
    where: { vin },
    select: { plate: true },
  });

  const plateValues = plates.map((p) => p.plate);

  let plateReports: typeof reports = [];
  if (plateValues.length > 0) {
    plateReports = await prisma.stolenReport.findMany({
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
