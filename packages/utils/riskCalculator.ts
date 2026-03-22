// ============================================================
// CuliCars — packages/utils/riskCalculator.ts
// Risk scoring weights and thresholds per master plan Section 5
// ============================================================

export type RiskLevel = 'clean' | 'low' | 'medium' | 'high' | 'critical';
export type Recommendation = 'proceed' | 'caution' | 'avoid';

export interface RiskFactor {
  id: string;
  category: string;
  points: number;
  description: string;
}

// ---- Scoring Weights (from master plan) ----

export const RISK_WEIGHTS = {
  STOLEN_WANTED:          40,  // Stolen/wanted community report
  SEVERE_STRUCTURAL:      30,  // Severe structural damage
  MILEAGE_ROLLBACK:       25,  // Mileage rollback detected
  FINANCE_CAVEAT:         20,  // Finance caveat / logbook charge
  FAILED_INSPECTION:      15,  // Failed / expired inspection
  PSV_MATATU_TAXI:        10,  // PSV / matatu / taxi history
  HIGH_OWNERSHIP:         10,  // 4+ ownership changes
  LOW_AUCTION_GRADE:      10,  // Japan auction grade below 3
  NO_NTSA_DATA:            5,  // No NTSA data at all
} as const;

// ---- Thresholds ----

export const RISK_THRESHOLDS = {
  CLEAN:    { max: 0,   level: 'clean'    as RiskLevel },
  LOW:      { max: 15,  level: 'low'      as RiskLevel },
  MEDIUM:   { max: 35,  level: 'medium'   as RiskLevel },
  HIGH:     { max: 60,  level: 'high'     as RiskLevel },
  CRITICAL: { max: 100, level: 'critical' as RiskLevel },
};

export function calculateRiskLevel(score: number): RiskLevel {
  if (score <= 0)  return 'clean';
  if (score <= 15) return 'low';
  if (score <= 35) return 'medium';
  if (score <= 60) return 'high';
  return 'critical';
}

export function calculateRecommendation(level: RiskLevel): Recommendation {
  switch (level) {
    case 'clean':
    case 'low':
      return 'proceed';
    case 'medium':
      return 'caution';
    case 'high':
    case 'critical':
      return 'avoid';
  }
}

export interface RiskInput {
  hasStolenReport: boolean;
  hasSevereDamage: boolean;
  hasMileageRollback: boolean;
  hasFinanceCaveat: boolean;
  hasFailedInspection: boolean;
  hasPsvHistory: boolean;
  ownershipChanges: number;
  japanAuctionGrade: string | null;
  hasNtsaData: boolean;
}

export interface RiskResult {
  score: number;
  level: RiskLevel;
  recommendation: Recommendation;
  factors: RiskFactor[];
}

export function calculateRisk(input: RiskInput): RiskResult {
  const factors: RiskFactor[] = [];
  let score = 0;

  if (input.hasStolenReport) {
    score += RISK_WEIGHTS.STOLEN_WANTED;
    factors.push({
      id: 'stolen_wanted',
      category: 'Theft',
      points: RISK_WEIGHTS.STOLEN_WANTED,
      description: 'Vehicle has an active stolen/wanted report',
    });
  }

  if (input.hasSevereDamage) {
    score += RISK_WEIGHTS.SEVERE_STRUCTURAL;
    factors.push({
      id: 'severe_structural',
      category: 'Damage',
      points: RISK_WEIGHTS.SEVERE_STRUCTURAL,
      description: 'Severe structural damage recorded',
    });
  }

  if (input.hasMileageRollback) {
    score += RISK_WEIGHTS.MILEAGE_ROLLBACK;
    factors.push({
      id: 'mileage_rollback',
      category: 'Odometer',
      points: RISK_WEIGHTS.MILEAGE_ROLLBACK,
      description: 'Odometer rollback detected in mileage history',
    });
  }

  if (input.hasFinanceCaveat) {
    score += RISK_WEIGHTS.FINANCE_CAVEAT;
    factors.push({
      id: 'finance_caveat',
      category: 'Financial',
      points: RISK_WEIGHTS.FINANCE_CAVEAT,
      description: 'Financial restriction or logbook charge found',
    });
  }

  if (input.hasFailedInspection) {
    score += RISK_WEIGHTS.FAILED_INSPECTION;
    factors.push({
      id: 'failed_inspection',
      category: 'Legal',
      points: RISK_WEIGHTS.FAILED_INSPECTION,
      description: 'Failed or expired NTSA inspection',
    });
  }

  if (input.hasPsvHistory) {
    score += RISK_WEIGHTS.PSV_MATATU_TAXI;
    factors.push({
      id: 'psv_matatu_taxi',
      category: 'Purpose',
      points: RISK_WEIGHTS.PSV_MATATU_TAXI,
      description: 'PSV/matatu/taxi commercial use history',
    });
  }

  if (input.ownershipChanges >= 4) {
    score += RISK_WEIGHTS.HIGH_OWNERSHIP;
    factors.push({
      id: 'high_ownership',
      category: 'Ownership',
      points: RISK_WEIGHTS.HIGH_OWNERSHIP,
      description: `${input.ownershipChanges} ownership changes (high turnover)`,
    });
  }

  if (input.japanAuctionGrade !== null) {
    const grade = parseFloat(input.japanAuctionGrade);
    if (!isNaN(grade) && grade < 3) {
      score += RISK_WEIGHTS.LOW_AUCTION_GRADE;
      factors.push({
        id: 'low_auction_grade',
        category: 'Import',
        points: RISK_WEIGHTS.LOW_AUCTION_GRADE,
        description: `Japan auction grade ${input.japanAuctionGrade} (below 3)`,
      });
    }
  }

  if (!input.hasNtsaData) {
    score += RISK_WEIGHTS.NO_NTSA_DATA;
    factors.push({
      id: 'no_ntsa_data',
      category: 'Data',
      points: RISK_WEIGHTS.NO_NTSA_DATA,
      description: 'No official NTSA data available',
    });
  }

  // Cap at 100
  score = Math.min(score, 100);

  const level = calculateRiskLevel(score);
  const recommendation = calculateRecommendation(level);

  return { score, level, recommendation, factors };
}
