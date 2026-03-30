// apps/api/src/services/fuzzyMatcher.ts
import { prisma } from '../lib/prisma';

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }

  return dp[m][n];
}

export interface FuzzySuggestion {
  plate: string;
  plate_display: string | null;
  vin: string;
  distance: number;
}

export async function findSimilarPlates(
  normalizedPlate: string,
  maxDistance: number = 2,
  limit: number = 5
): Promise<FuzzySuggestion[]> {
  let prefix: string;
  if (normalizedPlate.startsWith('K')) {
    prefix = normalizedPlate.substring(0, 3);
  } else {
    prefix = normalizedPlate.substring(0, 2);
  }

  const candidates = await prisma.plate_vin_map.findMany({
    where: { plate: { startsWith: prefix } },
    select: { plate: true, plate_display: true, vin: true },
    take: 200,
  });

  return candidates
    .map((c) => ({
      plate: c.plate,
      plate_display: c.plate_display,
      vin: c.vin,
      distance: levenshtein(normalizedPlate, c.plate),
    }))
    .filter((s) => s.distance > 0 && s.distance <= maxDistance)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit);
}

export async function getSuggestionStrings(
  normalizedPlate: string,
  maxDistance: number = 2
): Promise<string[]> {
  const suggestions = await findSimilarPlates(normalizedPlate, maxDistance);
  return suggestions.map((s) => s.plate_display ?? s.plate);
}
