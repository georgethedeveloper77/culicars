"use strict";
// ============================================================
// CuliCars — Thread 4: Upload Handler (Supabase Storage)
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadError = void 0;
exports.uploadFile = uploadFile;
exports.downloadFile = downloadFile;
const supabaseAdmin_1 = require("../lib/supabaseAdmin");
const crypto_1 = require("crypto");
const BUCKET_NAME = 'ocr-uploads';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
];
/**
 * Upload a file buffer to Supabase Storage.
 * Returns the public URL for the uploaded file.
 */
async function uploadFile(buffer, originalName, mimeType, userId) {
    // Validate mime type
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
        throw new UploadError(`Unsupported file type: ${mimeType}. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`);
    }
    // Validate size
    if (buffer.length > MAX_FILE_SIZE) {
        throw new UploadError(`File too large: ${(buffer.length / 1024 / 1024).toFixed(1)}MB. Max: 10MB`);
    }
    // Build storage path: ocr-uploads/{userId}/{uuid}.{ext}
    const ext = getExtension(originalName, mimeType);
    const fileName = `${(0, crypto_1.randomUUID)()}.${ext}`;
    const storagePath = `${userId}/${fileName}`;
    const { data, error } = await supabaseAdmin_1.supabaseAdmin.storage
        .from(BUCKET_NAME)
        .upload(storagePath, buffer, {
        contentType: mimeType,
        upsert: false,
    });
    if (error) {
        throw new UploadError(`Storage upload failed: ${error.message}`);
    }
    // Get public URL
    const { data: urlData } = supabaseAdmin_1.supabaseAdmin.storage
        .from(BUCKET_NAME)
        .getPublicUrl(data.path);
    return {
        url: urlData.publicUrl,
        path: data.path,
        bucket: BUCKET_NAME,
    };
}
/**
 * Download a file from a URL into a Buffer.
 * Used for NTSA COR PDF fetch.
 */
async function downloadFile(url) {
    const response = await fetch(url, {
        headers: {
            'User-Agent': 'CuliCars/1.0',
        },
        signal: AbortSignal.timeout(30000), // 30s timeout
    });
    if (!response.ok) {
        throw new UploadError(`Failed to download file: HTTP ${response.status} from ${new URL(url).hostname}`);
    }
    const contentType = response.headers.get('content-type') || 'application/pdf';
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    if (buffer.length > MAX_FILE_SIZE) {
        throw new UploadError('Downloaded file exceeds 10MB limit');
    }
    return { buffer, mimeType: contentType.split(';')[0].trim() };
}
function getExtension(filename, mimeType) {
    // Try from filename first
    const dotIdx = filename.lastIndexOf('.');
    if (dotIdx > 0) {
        return filename.slice(dotIdx + 1).toLowerCase();
    }
    // Fallback from mime
    const mimeMap = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp',
        'application/pdf': 'pdf',
    };
    return mimeMap[mimeType] || 'bin';
}
class UploadError extends Error {
    constructor(message) {
        super(message);
        this.name = 'UploadError';
    }
}
exports.UploadError = UploadError;
