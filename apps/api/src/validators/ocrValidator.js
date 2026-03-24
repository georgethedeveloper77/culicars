"use strict";
// ============================================================
// CuliCars — Thread 4: OCR Validators
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.consentBodySchema = exports.ntsaCorBodySchema = exports.ocrScanBodySchema = void 0;
const zod_1 = require("zod");
exports.ocrScanBodySchema = zod_1.z.object({
    documentType: zod_1.z.enum([
        'logbook',
        'import_doc',
        'dashboard',
        'plate_photo',
    ]),
});
exports.ntsaCorBodySchema = zod_1.z.object({
    pdfUrl: zod_1.z
        .string()
        .url('pdfUrl must be a valid URL')
        .refine((url) => url.includes('ecitizen.go.ke') || url.includes('ntsa.go.ke'), 'PDF URL must originate from eCitizen or NTSA domain'),
    consentId: zod_1.z.string().uuid('consentId must be a valid UUID'),
});
exports.consentBodySchema = zod_1.z.object({
    vin: zod_1.z.string().length(17, 'VIN must be 17 characters'),
    plate: zod_1.z.string().min(2, 'Plate is required').max(15),
});
