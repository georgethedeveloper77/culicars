// apps/api/src/routes/ocr.ts
import { Router, type Request, type Response } from "express";
import multer from "multer";
import { normalizeVin, normalizePlate } from "../lib/normalize";
import { badRequest } from "../lib/errors";
import * as store from "../store";

const router: Router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 6 * 1024 * 1024 } });

function extractVinFromText(text: string): string | null {
  // VIN: 17 chars, excluding I,O,Q
  const m = text
    .toUpperCase()
    .match(/\b([A-HJ-NPR-Z0-9]{17})\b/);
  return m?.[1] ?? null;
}

function extractPlateFromText(text: string): string | null {
  // Loose Kenyan-ish plate patterns (you can refine later)
  const t = text.toUpperCase().replace(/\s+/g, "");
  // Examples: KDA123A, KDG271X, KAA123A etc
  const m = t.match(/\bK[A-Z]{2}\d{3}[A-Z]\b/);
  return m?.[0] ?? null;
}

/**
 * POST /ocr/scan
 * multipart: file
 * json: { imageBase64 }
 *
 * For now we don't do real OCR; we accept optional "hintText" in body for dev/testing.
 */
router.post("/scan", upload.single("file"), async (req: Request, res: Response) => {
  const hintText = String(req.body?.hintText || "");

  const imageBase64 = typeof req.body?.imageBase64 === "string" ? req.body.imageBase64 : null;
  const hasFile = !!req.file?.buffer?.length;

  if (!hasFile && !imageBase64 && !hintText) {
    throw badRequest("Provide a file upload, imageBase64, or hintText for demo.");
  }

  // ---- Demo OCR flow ----
  // Replace this later with a real OCR engine (Tesseract/Google Vision/etc).
  const detectedVin = normalizeVin(extractVinFromText(hintText));
  const detectedPlate = normalizePlate(extractPlateFromText(hintText));

  // If we got VIN, we can directly find/create report.
  let reportId: string | null = null;
  if (detectedVin) {
    const existing = store.getReportByVin?.(detectedVin);
    reportId = existing?.id ?? null;
  }

  // If we got plate, resolve candidates.
  const candidates =
    detectedPlate ? store.resolvePlateToVinCandidates(detectedPlate) : [];

  return res.json({
    ok: true,
    vin: detectedVin ?? null,
    plate: detectedPlate ?? null,
    reportId,
    candidates: (candidates || []).map((c: any) => ({
      vin: normalizeVin(c.vin) ?? c.vin,
      confidence: typeof c.confidence === "number" ? c.confidence : 0.6,
      source: c.source ?? "unknown",
      existingReportId: store.getReportByVin?.(normalizeVin(c.vin) ?? c.vin)?.id ?? null,
    })),
    note:
      "OCR is currently demo-mode. Send hintText to test, then we’ll plug a real OCR provider.",
  });
});

export default router;