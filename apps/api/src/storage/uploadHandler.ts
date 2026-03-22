// ============================================================
// CuliCars — Thread 4: Upload Handler (Supabase Storage)
// ============================================================

import { supabaseAdmin } from '../lib/supabaseAdmin';
import { randomUUID } from 'crypto';
import type { UploadResult } from '../types/ocr.types';

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
export async function uploadFile(
  buffer: Buffer,
  originalName: string,
  mimeType: string,
  userId: string
): Promise<UploadResult> {
  // Validate mime type
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    throw new UploadError(
      `Unsupported file type: ${mimeType}. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`
    );
  }

  // Validate size
  if (buffer.length > MAX_FILE_SIZE) {
    throw new UploadError(
      `File too large: ${(buffer.length / 1024 / 1024).toFixed(1)}MB. Max: 10MB`
    );
  }

  // Build storage path: ocr-uploads/{userId}/{uuid}.{ext}
  const ext = getExtension(originalName, mimeType);
  const fileName = `${randomUUID()}.${ext}`;
  const storagePath = `${userId}/${fileName}`;

  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .upload(storagePath, buffer, {
      contentType: mimeType,
      upsert: false,
    });

  if (error) {
    throw new UploadError(`Storage upload failed: ${error.message}`);
  }

  // Get public URL
  const { data: urlData } = supabaseAdmin.storage
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
export async function downloadFile(url: string): Promise<{
  buffer: Buffer;
  mimeType: string;
}> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'CuliCars/1.0',
    },
    signal: AbortSignal.timeout(30_000), // 30s timeout
  });

  if (!response.ok) {
    throw new UploadError(
      `Failed to download file: HTTP ${response.status} from ${new URL(url).hostname}`
    );
  }

  const contentType = response.headers.get('content-type') || 'application/pdf';
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (buffer.length > MAX_FILE_SIZE) {
    throw new UploadError('Downloaded file exceeds 10MB limit');
  }

  return { buffer, mimeType: contentType.split(';')[0].trim() };
}

function getExtension(filename: string, mimeType: string): string {
  // Try from filename first
  const dotIdx = filename.lastIndexOf('.');
  if (dotIdx > 0) {
    return filename.slice(dotIdx + 1).toLowerCase();
  }
  // Fallback from mime
  const mimeMap: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'application/pdf': 'pdf',
  };
  return mimeMap[mimeType] || 'bin';
}

export class UploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UploadError';
  }
}
