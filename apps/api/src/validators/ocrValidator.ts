// apps/api/src/validators/ocrValidator.ts

import { Request, Response, NextFunction } from 'express';

/**
 * Validates the mode query/body param for /ocr/scan.
 */
export function validateScanMode(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const mode = req.body?.mode ?? req.query?.mode ?? 'auto';
  const valid = ['auto', 'plate', 'vin'];
  if (!valid.includes(mode as string)) {
    res.status(400).json({ error: `Invalid mode '${mode}'. Must be one of: ${valid.join(', ')}` });
    return;
  }
  next();
}

/**
 * Validates that a VIN or plate is present for /ocr/ntsa-cor.
 */
export function validateCorRequest(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const { vin, plate } = req.body as { vin?: string; plate?: string };
  if (!vin && !plate) {
    res.status(400).json({ error: 'Provide at least one of: vin, plate' });
    return;
  }
  next();
}
