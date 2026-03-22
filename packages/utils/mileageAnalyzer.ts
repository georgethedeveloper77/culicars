// ============================================================
// CuliCars — packages/utils/mileageAnalyzer.ts
// Mileage rollback detection + statistical analysis
// ============================================================

export interface MileageEntry {
  date: string;       // ISO date string
  mileage: number;    // km
  source: string;     // e.g. "scraper_jiji", "ntsa_cor", "autoexpress"
}

export interface AnalyzedMileageEntry extends MileageEntry {
  isRollback: boolean;
  rollbackAmount?: number;  // how many km it went backwards
}

export interface MileageAnalysis {
  records: AnalyzedMileageEntry[];
  lastKnownMileage: number | null;
  rollbackDetected: boolean;
  rollbackCount: number;
  totalRollbackKm: number;
  averageAnnualKm: number | null;
  chartData: Array<{
    date: string;
    mileage: number;
    isRollback: boolean;
  }>;
}

/**
 * Sort mileage entries chronologically by date.
 */
function sortByDate(entries: MileageEntry[]): MileageEntry[] {
  return [...entries].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
}

/**
 * Analyze mileage records for rollback.
 * A rollback = mileage decreasing compared to a previous reading.
 * 
 * Tolerance: small decreases (<500km) may be rounding or unit differences,
 * so we only flag rollbacks > 500km.
 */
export function analyzeMileage(
  entries: MileageEntry[],
  rollbackThresholdKm: number = 500
): MileageAnalysis {
  if (entries.length === 0) {
    return {
      records: [],
      lastKnownMileage: null,
      rollbackDetected: false,
      rollbackCount: 0,
      totalRollbackKm: 0,
      averageAnnualKm: null,
      chartData: [],
    };
  }

  const sorted = sortByDate(entries);
  const analyzed: AnalyzedMileageEntry[] = [];
  let maxMileageSoFar = 0;
  let rollbackCount = 0;
  let totalRollbackKm = 0;

  for (let i = 0; i < sorted.length; i++) {
    const entry = sorted[i];
    const isRollback =
      i > 0 &&
      entry.mileage < maxMileageSoFar - rollbackThresholdKm;

    const rollbackAmount = isRollback
      ? maxMileageSoFar - entry.mileage
      : undefined;

    if (isRollback && rollbackAmount) {
      rollbackCount++;
      totalRollbackKm += rollbackAmount;
    }

    analyzed.push({
      ...entry,
      isRollback,
      rollbackAmount,
    });

    if (entry.mileage > maxMileageSoFar) {
      maxMileageSoFar = entry.mileage;
    }
  }

  // Last known = highest reliable reading (not a rollback)
  const lastKnownMileage = maxMileageSoFar > 0 ? maxMileageSoFar : null;

  // Average annual km
  let averageAnnualKm: number | null = null;
  if (sorted.length >= 2) {
    const firstDate = new Date(sorted[0].date);
    const lastDate = new Date(sorted[sorted.length - 1].date);
    const years =
      (lastDate.getTime() - firstDate.getTime()) /
      (365.25 * 24 * 60 * 60 * 1000);
    if (years > 0.25) {
      // Need at least 3 months of data
      const firstMileage = sorted[0].mileage;
      const lastMileage = sorted[sorted.length - 1].mileage;
      const diff = lastMileage - firstMileage;
      if (diff > 0) {
        averageAnnualKm = Math.round(diff / years);
      }
    }
  }

  // Chart data
  const chartData = analyzed.map((r) => ({
    date: r.date,
    mileage: r.mileage,
    isRollback: r.isRollback,
  }));

  return {
    records: analyzed,
    lastKnownMileage,
    rollbackDetected: rollbackCount > 0,
    rollbackCount,
    totalRollbackKm,
    averageAnnualKm,
    chartData,
  };
}

/**
 * Calculate average mileage for similar vehicles.
 * Uses a simple formula: ~15,000 km/year for passenger vehicles in Kenya.
 * Adjusted based on vehicle age.
 */
export function estimateAverageForSimilar(
  year: number | null,
  make?: string,
  model?: string
): { average: number | null; description: string | null } {
  if (!year) return { average: null, description: null };

  const currentYear = new Date().getFullYear();
  const age = currentYear - year;

  if (age <= 0) return { average: null, description: null };

  // Kenya average: ~15,000 km/year for private vehicles
  // Slightly higher for popular models like Fielder, Axio
  const annualAverage = 15_000;
  const average = annualAverage * age;

  const description = model && make
    ? `${year} ${make} ${model}s`
    : `${year} vehicles`;

  return {
    average: Math.round(average),
    description: `Average for similar ${description}: ${average.toLocaleString()} km`,
  };
}
