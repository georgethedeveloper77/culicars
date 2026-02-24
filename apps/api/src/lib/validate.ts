import { z } from "zod";

export const CreateReportSchema = z.object({
  vin: z.string().min(5).max(32)
});

export const SubmitContributionSchema = z.object({
  vin: z.string().min(5).max(32),
  plate: z.string().min(3).max(16).optional(),
  notes: z.string().max(1000).optional(),
  mileageKm: z.number().int().min(0).max(5_000_000).optional(),
  condition: z
    .object({
      accident: z.boolean().optional(),
      flood: z.boolean().optional(),
      engine: z.enum(["good", "ok", "bad"]).optional()
    })
    .optional(),
  evidenceUrls: z.array(z.string().url()).max(10).optional(),
  anonId: z.string().min(6).max(64)
});