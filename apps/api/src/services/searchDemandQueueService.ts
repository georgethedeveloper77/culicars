// apps/api/src/services/searchDemandQueueService.ts

import { prisma } from '@culicars/database';
import { ResultState } from '../types/result.types';

export interface DemandQueueEntry {
  id: string;
  plate: string | null;
  vin: string | null;
  resultState: string;
  timesRequested: number;
  lastRequestedAt: Date;
  enrichedAt: Date | null;
  created_at: Date;
}

export interface ListQueueResult {
  entries: DemandQueueEntry[];
  total: number;
  page: number;
  pageSize: number;
}

export async function enqueue(params: {
  plate?: string | null;
  vin?: string | null;
  resultState: ResultState;
}): Promise<void> {
  const { plate, vin, resultState } = params;

  if (!plate && !vin) {
    console.warn(JSON.stringify({ msg: 'searchDemandQueueService.enqueue: called with neither plate nor vin' }));
    return;
  }

  try {
    if (vin) {
      await prisma.$executeRaw`
        INSERT INTO search_demand_queue (vin, plate, result_state, times_requested, last_requested_at)
        VALUES (${vin}, ${plate ?? null}, ${resultState}, 1, now())
        ON CONFLICT (vin) WHERE enriched_at IS NULL
        DO UPDATE SET
          times_requested   = search_demand_queue.times_requested + 1,
          last_requested_at = now(),
          result_state      = EXCLUDED.result_state
      `;
    } else if (plate) {
      await prisma.$executeRaw`
        INSERT INTO search_demand_queue (plate, vin, result_state, times_requested, last_requested_at)
        VALUES (${plate}, ${vin ?? null}, ${resultState}, 1, now())
        ON CONFLICT (plate) WHERE enriched_at IS NULL
        DO UPDATE SET
          times_requested   = search_demand_queue.times_requested + 1,
          last_requested_at = now(),
          result_state      = EXCLUDED.result_state
      `;
    }
  } catch (err) {
    console.error(JSON.stringify({ msg: 'searchDemandQueueService: enqueue failed', err: String(err), plate, vin, resultState }));
  }
}

export async function markEnriched(params: { plate?: string | null; vin?: string | null }): Promise<void> {
  const { plate, vin } = params;
  try {
    await prisma.$executeRaw`
      UPDATE search_demand_queue
      SET enriched_at = now()
      WHERE enriched_at IS NULL
        AND (
          (${vin}::text   IS NOT NULL AND vin   = ${vin})
          OR
          (${plate}::text IS NOT NULL AND plate = ${plate})
        )
    `;
  } catch (err) {
    console.error(JSON.stringify({ msg: 'searchDemandQueueService: markEnriched failed', err: String(err), plate, vin }));
  }
}

export async function listQueue(params: {
  page?: number;
  pageSize?: number;
  state?: string;
}): Promise<ListQueueResult> {
  const page     = Math.max(1, params.page     ?? 1);
  const pageSize = Math.min(100, params.pageSize ?? 25);
  const offset   = (page - 1) * pageSize;

  const whereClause = params.state
    ? `WHERE result_state = '${params.state}' AND enriched_at IS NULL`
    : `WHERE enriched_at IS NULL`;

  const [rows, countRows] = await Promise.all([
    prisma.$queryRawUnsafe<DemandQueueEntry[]>(`
      SELECT id, plate, vin, result_state as "resultState",
             times_requested  as "timesRequested",
             last_requested_at as "lastRequestedAt",
             enriched_at       as "enrichedAt",
             created_at        as "createdAt"
      FROM search_demand_queue
      ${whereClause}
      ORDER BY last_requested_at DESC
      LIMIT ${pageSize} OFFSET ${offset}
    `),
    prisma.$queryRawUnsafe<[{ count: bigint }]>(`
      SELECT COUNT(*) FROM search_demand_queue ${whereClause}
    `),
  ]);

  return {
    entries: rows,
    total:   Number(countRows[0]?.count ?? 0),
    page,
    pageSize,
  };
}
