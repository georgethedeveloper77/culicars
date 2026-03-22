// ============================================================
// CuliCars — Thread 4: OCR Route
// ============================================================
// POST /ocr/scan — User uploads logbook/dashboard/plate photo
// Requires auth. Multer handles multipart file upload.

import { Router, type Request, type Response, type NextFunction } from 'express';
import multer from 'multer';
import { ocrScanBodySchema } from '../validators/ocrValidator';
import { processImageOcr } from '../services/ocrService';
import { uploadFile, UploadError } from '../storage/uploadHandler';

const router = Router();

// Multer: in-memory storage, max 10MB, images only
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}. Allowed: JPEG, PNG, WebP`));
    }
  },
});

/**
 * POST /ocr/scan
 *
 * Body (multipart/form-data):
 *   - image: file (JPEG, PNG, or WebP, max 10MB)
 *   - documentType: 'logbook' | 'import_doc' | 'dashboard' | 'plate_photo'
 *
 * Auth: Required (JWT)
 *
 * Returns: OcrScanResponse with extracted plate/VIN/chassis
 */
router.post(
  '/scan',
  upload.single('image'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate file presence
      if (!req.file) {
        return res.status(400).json({
          error: 'MISSING_FILE',
          message: 'Image file is required. Send as multipart/form-data with field name "image".',
          statusCode: 400,
        });
      }

      // Validate body params
      const bodyResult = ocrScanBodySchema.safeParse(req.body);
      if (!bodyResult.success) {
        return res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: bodyResult.error.issues.map((i) => i.message).join('; '),
          statusCode: 400,
        });
      }

      const { documentType } = bodyResult.data;
      const userId = req.user!.id;

      // Upload image to Supabase Storage
      const uploaded = await uploadFile(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        userId
      );

      // Run OCR pipeline
      const result = await processImageOcr({
        imageBuffer: req.file.buffer,
        imageUrl: uploaded.url,
        documentType: documentType as any,
        userId,
        source: 'user_upload',
      });

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      if (err instanceof UploadError) {
        return res.status(400).json({
          error: 'UPLOAD_ERROR',
          message: err.message,
          statusCode: 400,
        });
      }

      // Multer errors
      if (err instanceof multer.MulterError) {
        const message =
          err.code === 'LIMIT_FILE_SIZE'
            ? 'File too large. Maximum size is 10MB.'
            : err.message;
        return res.status(400).json({
          error: 'UPLOAD_ERROR',
          message,
          statusCode: 400,
        });
      }

      next(err);
    }
  }
);

export default router;
