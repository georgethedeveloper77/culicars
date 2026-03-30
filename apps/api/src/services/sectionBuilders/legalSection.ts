// ============================================================
// CuliCars — Section Builder: LEGAL (LOCKED)
// Financial restrictions + legal checks
// ============================================================

import { prisma } from '../../lib/prisma';
import type { LegalSectionData, LegalCheckCard } from '../../types/report.types';

export async function buildLegalSection(vin: string): Promise<{
  data: LegalSectionData;
  record_count: number;
  data_status: 'found' | 'not_found' | 'not_checked';
}> {
  const [vehicle, legalEvents] = await Promise.all([
    prisma.vehicles.findUnique({
      where: { vin },
      select: {
        inspection_status: true,
        last_inspection_date: true,
        caveat_status: true,
      },
    }),

    prisma.vehicle_events.findMany({
      where: {
        vin,
        event_type: {
          in: ['INSPECTED', 'INSPECTION_FAILED', 'KRA_CLEARED', 'REGISTERED'],
        },
      },
      select: {
        event_type: true,
        event_date: true,
        county: true,
        source: true,
        metadata: true,
      },
      orderBy: { event_date: 'desc' },
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
    (e) => e.event_type === 'INSPECTED' || e.event_type === 'INSPECTION_FAILED'
  );

  const legalChecks: LegalCheckCard[] = [
    {
      type: 'inspection',
      label: 'NTSA Inspection (MOT)',
      category: 'legal',
      found: vehicle?.inspection_status !== 'unknown' && vehicle?.inspection_status !== null,
      details: vehicle?.inspection_status
        ? `Status: ${vehicle.inspection_status}${
            vehicle.last_inspection_date
              ? ` — ${vehicle.last_inspection_date.toISOString().split('T')[0]}`
              : ''
          }`
        : 'No inspection record found',
      date: vehicle?.last_inspection_date?.toISOString().split('T')[0],
      county: inspectionEvent?.county ?? undefined,
    },
    {
      type: 'caveat',
      label: 'Caveat / Court Order',
      category: 'legal',
      found: vehicle?.caveat_status === 'caveat',
      details: vehicle?.caveat_status === 'caveat'
        ? 'Caveat registered against this vehicle'
        : vehicle?.caveat_status === 'clear'
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
      found: legalEvents.some((e) => e.event_type === 'KRA_CLEARED'),
      details: legalEvents.some((e) => e.event_type === 'KRA_CLEARED')
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

  const record_count =
    financialRestrictions.filter((c) => c.found).length +
    legalChecks.filter((c) => c.found).length;

  return {
    data: {
      financialRestrictions,
      legalChecks,
      hasFinancialIssues,
      hasLegalIssues,
    },
    record_count,
    data_status: record_count > 0 ? 'found' : 'not_found',
  };
}
