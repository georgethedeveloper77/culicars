// ============================================================
// CuliCars — Thread 5: Report Validators
// ============================================================

import { z } from 'zod';

export const getReportByVinSchema = z.object({
  params: z.object({
    vin: z.string().length(17, 'VIN must be 17 characters'),
  }),
});

export const getReportByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid report ID'),
  }),
});

export const unlockReportSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid report ID'),
  }),
});

export type GetReportByVinInput = z.infer<typeof getReportByVinSchema>;
export type GetReportByIdInput = z.infer<typeof getReportByIdSchema>;
export type UnlockReportInput = z.infer<typeof unlockReportSchema>;
