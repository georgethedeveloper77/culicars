// apps/api/src/routes/ocr.ts

import { Router } from "express";

const router = Router();

type OcrRequest = {
  // image as base64 string (data URL allowed)
  imageBase64?: string;

  // optional: user can type “plate guess” to help matching
  hint?: string;
};

type OcrResponse = {
  ok: true;
  vin?: string;
  plate?: string;
  confidence: number; // 0..1
  rawText: string;
  note?: string;
};

// Very light VIN heuristic: 17 chars, A-H J-N P-R S-Z 0-9 (no I,O,Q).
function extractVin(text: string): string | null {
  const cleaned = text.toUpperCase().replace(/[^A-Z0-9]/g, " ");
  const tokens = cleaned.split(/\s+/).filter(Boolean);

  // VIN regex: 17 chars, excludes I,O,Q
  const vinRe = /^[A-HJ-NPR-Z0-9]{17}$/;

  for (const t of tokens) {
    if (vinRe.test(t)) return t;
  }
  return null;
}

// Kenyan plate heuristic (simple): K?? ####? e.g. KDG271X or KDA123A
function extractKenyanPlate(text: string): string | null {
  const cleaned = text.toUpperCase().replace(/[^A-Z0-9]/g, "");
  // Match K + 2 letters + 3/4 digits + optional letter (classic KE)
  // Examples: KDA123A, KDG271X, KBX123C, KDD1234
  const plateRe = /K[A-Z]{2}\d{3,4}[A-Z]?/g;
  const m = cleaned.match(plateRe);
  return m?.[0] ?? null;
}

router.post("/", async (req, res) => {
  const body = (req.body ?? {}) as OcrRequest;

  // NOTE: This is a stub. We don't actually OCR the image yet.
  // We simulate the pipeline using `hint` and basic regex extraction.

  const hint = (body.hint ?? "").toString();

  // Pretend OCR text:
  // - if hint given, include it in rawText so extraction can work.
  // - else return a generic mock that includes demo VIN + plate.
  const rawText = hint
    ? `USER_HINT ${hint}`
    : "VIN JH4KX12345ABC0001 PLATE KDG271X";

  const vin = extractVin(rawText) ?? undefined;
  const plate = extractKenyanPlate(rawText) ?? undefined;

  const response: OcrResponse = {
    ok: true,
    vin,
    plate,
    confidence: vin ? 0.92 : plate ? 0.75 : 0.2,
    rawText,
    note:
      "OCR is stubbed. Next step: real OCR engine (Vision API / Tesseract) + VIN-first parsing.",
  };

  res.json(response);
});

export default router;