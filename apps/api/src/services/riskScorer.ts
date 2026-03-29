// apps/api/src/services/riskScorer.ts

export interface RiskInput {
  hasStolen: boolean;
  hasRecovered: boolean;
  watchAlertCount: number;
  damageCount: number;
  ownershipConfidence: number; // 0–1
  odometerAnomalyDetected: boolean;
  sourceCount: number;
}

export interface RiskScore {
  score: number; // 0–100
  level: 'low' | 'medium' | 'high' | 'critical';
  flags: string[];
}

export function computeRiskScore(input: RiskInput): RiskScore {
  const flags: string[] = [];
  let score = 0;

  if (input.hasStolen) {
    score += 50;
    flags.push('Vehicle reported stolen');
  }

  if (input.hasRecovered && input.hasStolen) {
    // Recovered offsets stolen somewhat
    score -= 10;
    flags.push('Vehicle marked as recovered');
  }

  if (input.watchAlertCount > 0) {
    score += Math.min(input.watchAlertCount * 5, 20);
    flags.push(`${input.watchAlertCount} community watch alert(s)`);
  }

  if (input.damageCount > 0) {
    score += Math.min(input.damageCount * 5, 15);
    flags.push(`${input.damageCount} damage record(s)`);
  }

  if (input.odometerAnomalyDetected) {
    score += 15;
    flags.push('Odometer anomaly detected');
  }

  if (input.ownershipConfidence < 0.5) {
    score += 10;
    flags.push('Ownership confidence low');
  }

  if (input.sourceCount === 0) {
    score += 5;
    flags.push('No verified data sources');
  }

  score = Math.max(0, Math.min(100, score));

  const level: RiskScore['level'] =
    score >= 70 ? 'critical' :
    score >= 40 ? 'high' :
    score >= 20 ? 'medium' : 'low';

  return { score, level, flags };
}
