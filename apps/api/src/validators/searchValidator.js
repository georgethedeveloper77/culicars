"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchQuerySchema = void 0;
// apps/api/src/validators/searchValidator.ts
const zod_1 = require("zod");
exports.searchQuerySchema = zod_1.z.object({
    q: zod_1.z
        .string()
        .min(3, 'Search query must be at least 3 characters')
        .max(30, 'Search query too long')
        .transform((v) => v.trim()),
    type: zod_1.z
        .enum(['auto', 'plate', 'vin'])
        .optional()
        .default('auto'),
});
