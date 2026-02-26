// apps/api/src/routes/contributions.ts
import { Router, type Request, type Response } from "express";
import { normalizeVin, normalizePlate } from "../lib/normalize";
import { badRequest } from "../lib/errors";
import * as store from "../store";

const router: Router = Router();

/**
 * POST /contributions
 * Body:
 * {
 *   vin: string,
 *   plate?: string,
 *   payload: any,
 *   source?: string
 * }
 *
 * Contributions are always tied to VIN (primary index).
 */
router.post("/", (req: Request, res: Response) => {
  const vin = normalizeVin(req.body?.vin);
  const plate = normalizePlate(req.body?.plate);
  const payload = req.body?.payload;
  const source = String(req.body?.source || "user");

  if (!vin) throw badRequest("vin is required");
  if (payload == null) throw badRequest("payload is required");

  // Ensure report exists for this VIN (VIN-primary).
  const report = store.upsertReportForVin(vin, { plate: plate ?? undefined });

  const contribution = store.addContribution({
    reportId: report.id,
    vin,
    plate: plate ?? report?.vehicle?.plate ?? null,
    payload,
    source,
  });

  return res.status(201).json({
    ok: true,
    reportId: report.id,
    vin,
    contribution,
  });
});

export default router;