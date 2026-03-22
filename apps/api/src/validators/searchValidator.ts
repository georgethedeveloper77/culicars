// apps/api/src/validators/searchValidator.ts
import { z } from 'zod';

export const searchQuerySchema = z.object({
  q: z
    .string()
    .min(3, 'Search query must be at least 3 characters')
    .max(30, 'Search query too long')
    .transform((v) => v.trim()),
  type: z
    .enum(['auto', 'plate', 'vin'])
    .optional()
    .default('auto'),
});

export type SearchQueryInput = z.infer<typeof searchQuerySchema>;
