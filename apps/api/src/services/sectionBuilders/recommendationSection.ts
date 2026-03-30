// ============================================================
// CuliCars — Section Builder: RECOMMENDATION (LOCKED)
// Final verdict: PROCEED / CAUTION / AVOID with key findings
// ============================================================

import type { RecommendationSectionData } from '../../types/report.types';
import type { RiskResult } from '@culicars/utils/riskCalculator';

/**
 * Build the recommendation section from a pre-computed risk result.
 * This builder is unique — it doesn't query the DB directly.
 * Instead, it receives the RiskResult from the report generator
 * (which already ran the risk scorer).
 */
export function buildRecommendationSection(
  riskResult: RiskResult
): {
  data: RecommendationSectionData;
  record_count: number;
  data_status: 'found' | 'not_found' | 'not_checked';
} {
  // Generate summary based on level
  const summaries: Record<string, string> = {
    clean:
      'No issues found. This vehicle appears to have a clean history based on available data.',
    low:
      'Minor items noted but no significant concerns. Generally safe to proceed with standard due diligence.',
    medium:
      'Some concerns identified that warrant further investigation before purchase. Review the flagged sections carefully.',
    high:
      'Multiple significant issues found. We recommend thorough professional inspection and verification before proceeding.',
    critical:
      'Serious issues detected including potential theft, major damage, or critical legal problems. Exercise extreme caution.',
  };

  // Convert risk factors to key findings
  const severityMap: Record<number, 'info' | 'warning' | 'critical'> = {};
  // Points thresholds for severity
  const keyFindings = riskResult.factors.map((f) => ({
    category: f.category,
    finding: f.description,
    severity:
      f.points >= 30
        ? ('critical' as const)
        : f.points >= 15
          ? ('warning' as const)
          : ('info' as const),
  }));

  // If no factors, add a positive finding
  if (keyFindings.length === 0) {
    keyFindings.push({
      category: 'Overall',
      finding: 'No negative indicators found in available data sources',
      severity: 'info',
    });
  }

  return {
    data: {
      recommendation: riskResult.recommendation,
      risk_score: riskResult.score,
      risk_level: riskResult.level,
      summary: summaries[riskResult.level] || summaries.medium,
      keyFindings,
      breakdown: riskResult.factors.map((f) => ({
        category: f.category,
        points: f.points,
        description: f.description,
      })),
    },
    record_count: keyFindings.length,
    data_status: 'found',
  };
}
