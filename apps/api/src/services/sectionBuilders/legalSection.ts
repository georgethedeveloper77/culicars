// ============================================================
// CuliCars — Section Builder: LEGAL (LOCKED)
// Financial restrictions + legal checks
// ============================================================

import prisma from '../../lib/prisma';
import type { LegalSectionData, LegalCheckCard } from '../../types/report.types';

export async function buildLegalSection(vin: string): Promise<{
  data: LegalSectionData;
  recordCount: number;
  dataStatus: 'found' | 'not_found' | 'not_checked';
}> {
  const [vehicle, legalEvents] = await Promise.all([
    prisma.vehicle.findUnique({
      where: { vin },
      select: {
        inspectionStatus: true,
        lastInspectionDate: true,
        caveatStatus: true,
      },
    }),

    prisma.vehicleEvent.findMany({
      where: {
        vin,
        eventType: {
          in: ['INSPECTED', 'INSPECTION_FAILED', 'KRA_CLEARED', 'REGISTERED'],
        },
      },
      select: {
        eventType: true,
        eventDate: true,
        county: true,
        source: true,
        metadata: true,
      },
      orderBy: { eventDate: 'desc' },
    }),
  ]);

  // Build financial restriction cards
  const financialRestrictions: LegalCheckCard[] = [
    {
      type: 'logbook_loan',
      label: 'Logbook Loan / Charge',
      category: 'financial',
      found: false, // Future: check from KRA/bank partnership data
      details: 'Not yet checked — partnership data pending',
    },
    {
      type: 'hire_purchase',
      label: 'Hire Purchase',
      category: 'financial',
      found: false,
      details: 'Not yet checked — partnership data pending',
    },
    {
      type: 'unit_stocking',
      label: 'Unit Stocking / Dealer Finance',
      category: 'financial',
      found: false,
      details: 'Not yet checked — partnership data pending',
    },
  ];

  // Check event metadata for financial info
  for (const event of legalEvents) {
    const meta = event.metadata as Record<string, unknown> | null;
    if (meta?.logbookCharge) {
      financialRestrictions[0].found = true;
      financialRestrictions[0].details = 'Logbook charge registered';
    }
    if (meta?.hirePurchase) {
      financialRestrictions[1].found = true;
      financialRestrictions[1].details = 'Hire purchase agreement active';
    }
  }

  // Build legal check cards
  const inspectionEvent = legalEvents.find(
    (e) => e.eventType === 'INSPECTED' || e.eventType === 'INSPECTION_FAILED'
  );

  const legalChecks: LegalCheckCard[] = [
    {
      type: 'inspection',
      label: 'NTSA Inspection (MOT)',
      category: 'legal',
      found: vehicle?.inspectionStatus !== 'unknown' && vehicle?.inspectionStatus !== null,
      details: vehicle?.inspectionStatus
        ? `Status: ${vehicle.inspectionStatus}${
            vehicle.lastInspectionDate
              ? ` — ${vehicle.lastInspectionDate.toISOString().split('T')[0]}`
              : ''
          }`
        : 'No inspection record found',
      date: vehicle?.lastInspectionDate?.toISOString().split('T')[0],
      county: inspectionEvent?.county ?? undefined,
    },
    {
      type: 'caveat',
      label: 'Caveat / Court Order',
      category: 'legal',
      found: vehicle?.caveatStatus === 'caveat',
      details: vehicle?.caveatStatus === 'caveat'
        ? 'Caveat registered against this vehicle'
        : vehicle?.caveatStatus === 'clear'
          ? 'No caveat found'
          : 'Not checked',
    },
    {
      type: 'scrap',
      label: 'Scrap / Write-off',
      category: 'legal',
      found: false, // Future: insurance partnership data
      details: 'Not yet checked — insurance data pending',
    },
    {
      type: 'export_import',
      label: 'Export / Import (KRA)',
      category: 'legal',
      found: legalEvents.some((e) => e.eventType === 'KRA_CLEARED'),
      details: legalEvents.some((e) => e.eventType === 'KRA_CLEARED')
        ? 'KRA import clearance record found'
        : 'No KRA clearance record',
    },
    {
      type: 'insurance_writeoff',
      label: 'Insurance Write-off',
      category: 'legal',
      found: false, // Future: IRA partnership
      details: 'Not yet checked — IRA partnership pending',
    },
  ];

  const hasFinancialIssues = financialRestrictions.some((c) => c.found);
  const hasLegalIssues = legalChecks.some(
    (c) => c.found && (c.type === 'caveat' || c.type === 'scrap' || c.type === 'insurance_writeoff')
  );

  const recordCount =
    financialRestrictions.filter((c) => c.found).length +
    legalChecks.filter((c) => c.found).length;

  return {
    data: {
      financialRestrictions,
      legalChecks,
      hasFinancialIssues,
      hasLegalIssues,
    },
    recordCount,
    dataStatus: recordCount > 0 ? 'found' : 'not_found',
  };
}
