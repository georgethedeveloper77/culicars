// apps/api/src/services/storageService.ts
//
// Handles Supabase Storage bucket interactions for contributions
// and stolen vehicle report photos.
//
// Bucket layout:
//   contributions/{vin}/{contributionId}/evidence/{filename}
//   contributions/{vin}/{contributionId}/docs/{filename}
//   stolen-reports/{reportId}/{filename}

import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';

function getStorageClient() {
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
}

const CONTRIBUTION_BUCKET = 'contributions';
const STOLEN_BUCKET = 'stolen-reports';

export interface UploadResult {
  url: string;
  path: string;
}

/**
 * Generate a signed upload URL for a contribution evidence file.
 * The actual upload happens client-side; we just provide the signed URL.
 */
export async function getContributionEvidenceUploadUrl(params: {
  vin: string;
  contributionId: string;
  filename: string;
  isVerificationDoc: boolean;
}): Promise<UploadResult> {
  const supabase = getStorageClient();
  const folder = params.isVerificationDoc ? 'docs' : 'evidence';
  const path = `${params.vin}/${params.contributionId}/${folder}/${params.filename}`;

  const { data, error } = await supabase.storage
    .from(CONTRIBUTION_BUCKET)
    .createSignedUploadUrl(path);

  if (error || !data) {
    throw new Error(`Failed to create upload URL: ${error?.message}`);
  }

  return {
    url: data.signedUrl,
    path,
  };
}

/**
 * Generate a signed upload URL for a stolen report photo.
 */
export async function getStolenReportUploadUrl(params: {
  reportId: string;
  filename: string;
}): Promise<UploadResult> {
  const supabase = getStorageClient();
  const path = `${params.reportId}/${params.filename}`;

  const { data, error } = await supabase.storage
    .from(STOLEN_BUCKET)
    .createSignedUploadUrl(path);

  if (error || !data) {
    throw new Error(`Failed to create upload URL: ${error?.message}`);
  }

  return {
    url: data.signedUrl,
    path,
  };
}

/**
 * Get a public URL for a stored file.
 */
export function getPublicUrl(bucket: string, path: string): string {
  const supabase = getStorageClient();
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Delete all files under a path prefix (e.g. when rejecting a contribution).
 */
export async function deleteFolder(bucket: string, prefix: string): Promise<void> {
  const supabase = getStorageClient();

  const { data: files, error: listErr } = await supabase.storage.from(bucket).list(prefix);
  if (listErr || !files) return;

  const paths = files.map((f) => `${prefix}/${f.name}`);
  if (paths.length === 0) return;

  const { error: deleteErr } = await supabase.storage.from(bucket).remove(paths);
  if (deleteErr) {
    throw new Error(`Failed to delete files: ${deleteErr.message}`);
  }
}

export const BUCKETS = {
  CONTRIBUTIONS: CONTRIBUTION_BUCKET,
  STOLEN_REPORTS: STOLEN_BUCKET,
} as const;
