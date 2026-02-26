// apps/api/src/routes/plates.ts
import { Router, type Request, type Response } from "express";
import { normalizePlate, normalizeVin } from "../lib/normalize";
import { badRequest } from "../lib/errors";
import * as store from "../store";

const router: Router = Router();

/**
 * GET /plates/:plate
 * Returns VIN candidates. Plate is "human input"; VIN remains primary key.
 */
router.get("/:plate", (req: Request, res: Response) => {
  const plateRaw = String(req.params.plate || "");
  const plate = normalizePlate(plateRaw);

  if (!plate) throw badRequest("Invalid plate");

  const candidates = store.resolvePlateToVinCandidates(plate).map((c: any) => {
    const vin = normalizeVin(c.vin) ?? c.vin;
    const existing = store.getReportByVin?.(vin);

    return {
      vin,
      confidence: typeof c.confidence === "number" ? c.confidence : 0.6,
      source: c.source ?? "unknown",
      existingReportId: existing?.id ?? null,
    };
  });

  return res.json({
    plate,
    candidates,
  });
});

export default router;