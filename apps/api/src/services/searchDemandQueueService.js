"use strict";
// apps/api/src/services/searchDemandQueueService.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.enqueue = enqueue;
exports.markEnriched = markEnriched;
exports.listQueue = listQueue;
const database_1 = require("@culicars/database");
async function enqueue(params) {
    const { plate, vin, resultState } = params;
    if (!plate && !vin) {
        console.warn(JSON.stringify({ msg: 'searchDemandQueueService.enqueue: called with neither plate nor vin' }));
        return;
    }
    try {
        if (vin) {
            await database_1.prisma.$executeRaw `
        INSERT INTO search_demand_queue (vin, plate, result_state, times_requested, last_requested_at)
        VALUES (${vin}, ${plate ?? null}, ${resultState}, 1, now())
        ON CONFLICT (vin) WHERE enriched_at IS NULL
        DO UPDATE SET
          times_requested   = search_demand_queue.times_requested + 1,
          last_requested_at = now(),
          result_state      = EXCLUDED.result_state
      `;
        }
        else if (plate) {
            await database_1.prisma.$executeRaw `
        INSERT INTO search_demand_queue (plate, vin, result_state, times_requested, last_requested_at)
        VALUES (${plate}, ${vin ?? null}, ${resultState}, 1, now())
        ON CONFLICT (plate) WHERE enriched_at IS NULL
        DO UPDATE SET
          times_requested   = search_demand_queue.times_requested + 1,
          last_requested_at = now(),
          result_state      = EXCLUDED.result_state
      `;
        }
    }
    catch (err) {
        console.error(JSON.stringify({ msg: 'searchDemandQueueService: enqueue failed', err: String(err), plate, vin, resultState }));
    }
}
async function markEnriched(params) {
    const { plate, vin } = params;
    try {
        await database_1.prisma.$executeRaw `
      UPDATE search_demand_queue
      SET enriched_at = now()
      WHERE enriched_at IS NULL
        AND (
          (${vin}::text   IS NOT NULL AND vin   = ${vin})
          OR
          (${plate}::text IS NOT NULL AND plate = ${plate})
        )
    `;
    }
    catch (err) {
        console.error(JSON.stringify({ msg: 'searchDemandQueueService: markEnriched failed', err: String(err), plate, vin }));
    }
}
async function listQueue(params) {
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(100, params.pageSize ?? 25);
    const offset = (page - 1) * pageSize;
    const whereClause = params.state
        ? `WHERE result_state = '${params.state}' AND enriched_at IS NULL`
        : `WHERE enriched_at IS NULL`;
    const [rows, countRows] = await Promise.all([
        database_1.prisma.$queryRawUnsafe(`
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
        database_1.prisma.$queryRawUnsafe(`
      SELECT COUNT(*) FROM search_demand_queue ${whereClause}
    `),
    ]);
    return {
        entries: rows,
        total: Number(countRows[0]?.count ?? 0),
        page,
        pageSize,
    };
}
