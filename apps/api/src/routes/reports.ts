// apps/api/src/routes/reports.ts
import { Router, type Request, type Response } from "express";
import { normalizeVin, normalizePlate } from "../lib/normalize";
import { badRequest, notFound } from "../lib/errors";
import * as store from "../store";

const router: Router = Router();

/**
 * GET /reports/:id
 * :id can be a reportId or a VIN (we support both during transition).
 */
router.get("/:id", (req: Request, res: Response) => {
  const raw = String(req.params.id || "").trim();
  if (!raw) throw badRequest("Missing report id");

  // Try by reportId first, then treat as VIN.
  const byId = store.getReportById?.(raw);
  if (byId) return res.json(byId);

  const vin = normalizeVin(raw);
  if (!vin) throw badRequest("Invalid report id / VIN");

  const byVin = store.getReportByVin?.(vin);
  if (!byVin) throw notFound("Report not found");

  return res.json(byVin);
});

/**
 * POST /reports
 * Body: { vin: string, plate?: string }
 * Creates (or returns existing) report for VIN.
 */
router.post("/", (req: Request, res: Response) => {
  const vin = normalizeVin(req.body?.vin);
  const plate = normalizePlate(req.body?.plate);

  if (!vin) throw badRequest("VIN is required");

  const report = store.upsertReportForVin(vin, { plate: plate ?? undefined });
  return res.status(201).json({ id: report.id, vin: report.vehicle?.vin ?? vin });
});

/**
 * GET /reports?vin=...
 * Convenience lookup for VIN.
 */
router.get("/", (req: Request, res: Response) => {
  const vin = normalizeVin(String(req.query.vin || ""));
  if (!vin) throw badRequest("vin query is required");

  const report = store.getReportByVin?.(vin);
  if (!report) throw notFound("Report not found");
  return res.json(report);
});

export default router;