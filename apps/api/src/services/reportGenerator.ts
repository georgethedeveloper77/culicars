// apps/api/src/services/reportGenerator.ts

import { prisma } from '../lib/prisma';
import { computeRiskScore } from './riskScorer.js';
import { buildIdentitySection } from './sectionBuilders/identity.js';
import { buildStolenAlertsSection } from './sectionBuilders/stolenAlerts.js';
import { buildOwnershipSection } from './sectionBuilders/ownership.js';
import { buildDamageSection } from './sectionBuilders/damage.js';
import { buildOdometerSection } from './sectionBuilders/odometer.js';
import { buildTimelineSection } from './sectionBuilders/timeline.js';
import { buildCommunityInsightsSection } from './sectionBuilders/communityInsights.js';


export type ReportState =
  | 'verified'
  | 'partial'
  | 'low_confidence'
  | 'pending_enrichment';

export interface GeneratedReport {
  id: string;
  vin: string;
  plate: string | null;
  state: ReportState;
  risk_score: number;
  risk_level: string;
  riskFlags: string[];
  sections: Record<string, any>;
  generated_at: string;
}

/**
 * Generate or refresh the canonical report for a VIN.
 * isUnlocked controls which sections return full data vs locked shells.
 */
export async function generateReport(
  vin: string,
  isUnlocked: boolean = false
): Promise<GeneratedReport> {
  // Load all raw records for this VIN
  const rawRecords = await (prisma as any).raw_record.findMany({
    where: { vin },
    orderBy: { created_at: 'desc' },
  });

  // Load approved watch alerts
  const watchAlerts = await (prisma as any).watch_alert.findMany({
    where: { vin },
  });

  // Load approved contributions
  const contributions = await (prisma as any).contribution.findMany({
    where: { vin, status: 'approved' },
  });

  // Load plate from plate_vin_map
  const plateMap = await (prisma as any).plate_vin_map.findFirst({
    where: { vin },
  });
  const plate: string | null = plateMap?.plate ?? null;

  // --- Build sections ---
  const identity = buildIdentitySection(rawRecords);
  const stolenAlerts = buildStolenAlertsSection(watchAlerts);
  const ownership = buildOwnershipSection(rawRecords, isUnlocked);
  const damage = buildDamageSection(rawRecords, contributions, isUnlocked);
  const odometer = buildOdometerSection(rawRecords, contributions, isUnlocked);
  const timeline = buildTimelineSection(rawRecords, contributions, watchAlerts, isUnlocked);
  const communityInsights = buildCommunityInsightsSection(
    watchAlerts,
    identity.make,
    identity.model,
    isUnlocked
  );

  // --- Risk score ---
  const risk = computeRiskScore({
    hasStolen: stolenAlerts.isStolen,
    hasRecovered: stolenAlerts.isRecovered,
    watchAlertCount: watchAlerts.filter((a: any) => a.status === 'approved').length,
    damageCount: damage.record_count,
    ownershipConfidence: ownership.confidence,
    odometerAnomalyDetected: odometer.anomalyDetected,
    sourceCount: identity.sourceCount,
  });

  // --- Determine report state ---
  const state = deriveState(identity, rawRecords);

  const sections = {
    identity,
    stolenAlerts,
    ownership,
    damage,
    odometer,
    timeline,
    communityInsights,
  };

  // --- Persist canonical report ---
  const report = await upsertReport(vin, plate, state, risk, sections);

  return {
    id: report.id,
    vin,
    plate,
    state,
    risk_score: risk.score,
    risk_level: risk.level,
    riskFlags: risk.flags,
    sections,
    generated_at: report.updated_at?.toISOString() ?? new Date().toISOString(),
  };
}

function deriveState(identity: any, records: any[]): ReportState {
  if (records.length === 0) return 'pending_enrichment';

  const highConfidence = records.filter((r) => (r.confidence ?? 0) >= 0.8);
  if (highConfidence.length > 0 && identity.make && identity.vin) return 'verified';
  if (records.length >= 1 && (identity.make || identity.plate)) return 'partial';
  if (records.length >= 1) return 'low_confidence';
  return 'pending_enrichment';
}

async function upsertReport(
  vin: string,
  plate: string | null,
  state: ReportState,
  risk: any,
  sections: Record<string, any>
): Promise<any> {
  const existing = await (prisma as any).reports.findFirst({
    where: { vin },
  });

  const data = {
    vin,
    plate,
    state,
    risk_score: risk.score,
    risk_level: risk.level,
    risk_flags: risk.flags,
    sections_json: sections,
    updated_at: new Date(),
  };

  if (existing) {
    return (prisma as any).reports.update({
      where: { id: existing.id },
      data,
    });
  }

  return (prisma as any).reports.create({
    data: {
      ...data,
      created_at: new Date(),
    },
  });
}

/**
 * Record that a user has accessed (unlocked) a report.
 */
export async function recordReportAccess(
  reportId: string,
  userId: string
): Promise<void> {
  await (prisma as any).report_access.create({
    data: {
      report_id: reportId,
      user_id: userId,
      accessed_at: new Date(),
    },
  });
}

/**
 * Check whether a user has unlocked a given report.
 */
export async function hasUnlockedReport(
  reportId: string,
  userId: string
): Promise<boolean> {
  const access = await (prisma as any).report_access.findFirst({
    where: { report_id: reportId, user_id: userId },
  });
  return access != null;
}
