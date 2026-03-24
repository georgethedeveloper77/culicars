"use strict";
// apps/api/src/services/storageService.ts
//
// Handles Supabase Storage bucket interactions for contributions
// and stolen vehicle report photos.
//
// Bucket layout:
//   contributions/{vin}/{contributionId}/evidence/{filename}
//   contributions/{vin}/{contributionId}/docs/{filename}
//   stolen-reports/{reportId}/{filename}
Object.defineProperty(exports, "__esModule", { value: true });
exports.BUCKETS = void 0;
exports.getContributionEvidenceUploadUrl = getContributionEvidenceUploadUrl;
exports.getStolenReportUploadUrl = getStolenReportUploadUrl;
exports.getPublicUrl = getPublicUrl;
exports.deleteFolder = deleteFolder;
const supabase_js_1 = require("@supabase/supabase-js");
const env_js_1 = require("../config/env.js");
function getStorageClient() {
    return (0, supabase_js_1.createClient)(env_js_1.env.SUPABASE_URL, env_js_1.env.SUPABASE_SERVICE_ROLE_KEY);
}
const CONTRIBUTION_BUCKET = 'contributions';
const STOLEN_BUCKET = 'stolen-reports';
/**
 * Generate a signed upload URL for a contribution evidence file.
 * The actual upload happens client-side; we just provide the signed URL.
 */
async function getContributionEvidenceUploadUrl(params) {
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
async function getStolenReportUploadUrl(params) {
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
function getPublicUrl(bucket, path) {
    const supabase = getStorageClient();
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
}
/**
 * Delete all files under a path prefix (e.g. when rejecting a contribution).
 */
async function deleteFolder(bucket, prefix) {
    const supabase = getStorageClient();
    const { data: files, error: listErr } = await supabase.storage.from(bucket).list(prefix);
    if (listErr || !files)
        return;
    const paths = files.map((f) => `${prefix}/${f.name}`);
    if (paths.length === 0)
        return;
    const { error: deleteErr } = await supabase.storage.from(bucket).remove(paths);
    if (deleteErr) {
        throw new Error(`Failed to delete files: ${deleteErr.message}`);
    }
}
exports.BUCKETS = {
    CONTRIBUTIONS: CONTRIBUTION_BUCKET,
    STOLEN_REPORTS: STOLEN_BUCKET,
};
