// apps/api/src/services/analyticsService.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface DailyMetric {
  date: string;
  count: number;
}

export interface BusinessMetrics {
  searchesLast30Days: DailyMetric[];
  reportsGenerated: DailyMetric[];
  reportsUnlocked: DailyMetric[];
  revenueLast30Days: { date: string; amountKes: number }[];
  conversionRate: number; // searches -> unlocks
  totalCreditsIssued: number;
  totalCreditsConsumed: number;
}

export interface WatchInsights {
  topHotspots: { area: string; alertCount: number; lat: number; lng: number }[];
  mostReportedModels: { make: string; model: string; count: number }[];
  mostReportedParts: { partName: string; count: number }[];
  approvalRate: number;
  pendingCount: number;
  totalAlerts: number;
}

export interface DataJobHealth {
  sourceName: string;
  lastRunAt: Date | null;
  lastStatus: string | null;
  successRate: number;
  recordsIngested: number;
}

/**
 * Business analytics — admin only.
 */
export async function getBusinessMetrics(): Promise<BusinessMetrics> {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [searchRows, unlockRows, creditRows] = await Promise.all([
    prisma.$queryRaw<{ date: string; count: bigint }[]>`
      SELECT DATE("createdAt")::text as date, COUNT(*) as count
      FROM "Search"
      WHERE "createdAt" >= ${since}
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    `,
    prisma.$queryRaw<{ date: string; count: bigint }[]>`
      SELECT DATE("createdAt")::text as date, COUNT(*) as count
      FROM "ReportUnlock"
      WHERE "createdAt" >= ${since}
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    `,
    prisma.$queryRaw<{ total_issued: bigint; total_consumed: bigint }[]>`
      SELECT
        SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as total_issued,
        SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as total_consumed
      FROM "CreditLedger"
    `,
  ]);

  const searches = searchRows.map((r) => ({ date: r.date, count: Number(r.count) }));
  const unlocks = unlockRows.map((r) => ({ date: r.date, count: Number(r.count) }));

  const totalSearches = searches.reduce((s, r) => s + r.count, 0);
  const totalUnlocks = unlocks.reduce((s, r) => s + r.count, 0);
  const conversionRate = totalSearches > 0 ? totalUnlocks / totalSearches : 0;

  // Revenue: sum from credit ledger entries that originated from payments
  const revenueRows = await prisma.$queryRaw<{ date: string; amount: bigint }[]>`
    SELECT DATE("createdAt")::text as date, SUM(amount * 10) as amount
    FROM "CreditLedger"
    WHERE amount > 0 AND "createdAt" >= ${since}
    GROUP BY DATE("createdAt")
    ORDER BY date ASC
  `;

  return {
    searchesLast30Days: searches,
    reportsGenerated: searches, // proxy until Report table has separate generation event
    reportsUnlocked: unlocks,
    revenueLast30Days: revenueRows.map((r) => ({
      date: r.date,
      amountKes: Number(r.amount),
    })),
    conversionRate: Math.round(conversionRate * 100) / 100,
    totalCreditsIssued: Number(creditRows[0]?.total_issued ?? 0),
    totalCreditsConsumed: Number(creditRows[0]?.total_consumed ?? 0),
  };
}

/**
 * Watch insights — public-safe aggregated version strips individual records.
 */
export async function getWatchInsights(adminView = false): Promise<WatchInsights> {
  const [totalAlerts, pendingCount, approvedCount, topHotspotsRaw, topModelsRaw] =
    await Promise.all([
      (prisma as any).watchAlert.count(),
      (prisma as any).watchAlert.count({ where: { status: 'pending' } }),
      (prisma as any).watchAlert.count({ where: { status: 'approved' } }),
      // Hotspot clustering by approximate grid cell (0.01 degree ≈ 1 km)
      prisma.$queryRaw<{ area: string; alert_count: bigint; lat: number; lng: number }[]>`
        SELECT
          CONCAT(ROUND(lat::numeric, 2), ',', ROUND(lng::numeric, 2)) as area,
          COUNT(*) as alert_count,
          AVG(lat) as lat,
          AVG(lng) as lng
        FROM "WatchAlert"
        WHERE status = 'approved' AND lat IS NOT NULL AND lng IS NOT NULL
        GROUP BY ROUND(lat::numeric, 2), ROUND(lng::numeric, 2)
        ORDER BY alert_count DESC
        LIMIT 10
      `,
      // Most reported vehicle makes/models (from plate -> vehicle link if exists)
      prisma.$queryRaw<{ make: string; model: string; count: bigint }[]>`
        SELECT v.make, v.model, COUNT(*) as count
        FROM "WatchAlert" wa
        JOIN "Vehicle" v ON wa.vin = v.vin
        WHERE wa.status = 'approved' AND v.make IS NOT NULL
        GROUP BY v.make, v.model
        ORDER BY count DESC
        LIMIT 10
      `,
    ]);

  const approvalRate = totalAlerts > 0 ? approvedCount / (totalAlerts as number) : 0;

  return {
    topHotspots: topHotspotsRaw.map((r) => ({
      area: r.area,
      alertCount: Number(r.alert_count),
      lat: r.lat,
      lng: r.lng,
    })),
    mostReportedModels: topModelsRaw.map((r) => ({
      make: r.make,
      model: r.model,
      count: Number(r.count),
    })),
    // Parts theft data will come from alert.description field parsing — placeholder for now
    mostReportedParts: [],
    approvalRate: Math.round(approvalRate * 100) / 100,
    pendingCount: pendingCount as number,
    totalAlerts: totalAlerts as number,
  };
}

/**
 * Data job health summary for admin.
 */
export async function getDataJobHealth(): Promise<DataJobHealth[]> {
  const sources = await (prisma as any).dataSource.findMany({
    orderBy: { lastRunAt: 'desc' },
  });

  return sources.map((s: any) => ({
    sourceName: s.name,
    lastRunAt: s.lastRunAt,
    lastStatus: s.lastStatus,
    successRate: s.runCount > 0 ? s.successCount / s.runCount : 0,
    recordsIngested: s.recordsIngested ?? 0,
  }));
}
