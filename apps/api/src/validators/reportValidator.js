"use strict";
// ============================================================
// CuliCars — Thread 5: Report Validators
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.unlockReportSchema = exports.getReportByIdSchema = exports.getReportByVinSchema = void 0;
const zod_1 = require("zod");
exports.getReportByVinSchema = zod_1.z.object({
    params: zod_1.z.object({
        vin: zod_1.z.string().length(17, 'VIN must be 17 characters'),
    }),
});
exports.getReportByIdSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid('Invalid report ID'),
    }),
});
exports.unlockReportSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid('Invalid report ID'),
    }),
});
