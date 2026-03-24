"use strict";
// apps/api/src/services/contributionValidator.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateContributionSubmission = validateContributionSubmission;
const VALID_CONTRIB_TYPES = [
    'MILEAGE_RECORD',
    'DAMAGE_REPORT',
    'SERVICE_RECORD',
    'OWNERSHIP_TRANSFER',
    'LISTING_PROOF',
    'INSPECTION_RECORD',
    'IMPORT_DOCUMENT',
    'THEFT_REPORT',
    'PHOTO_EVIDENCE',
    'GENERAL_NOTE',
];
const MAX_EVIDENCE_URLS = 10;
const MAX_VERIFICATION_DOCS = 3;
const MAX_TITLE_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 2000;
function validateContributionSubmission(body) {
    const errors = [];
    // VIN
    if (!body.vin || typeof body.vin !== 'string') {
        errors.push('vin is required');
    }
    else if (!/^[A-HJ-NPR-Z0-9]{17}$/i.test(body.vin)) {
        errors.push('vin must be a valid 17-character VIN');
    }
    // Type
    if (!body.type) {
        errors.push('type is required');
    }
    else if (!VALID_CONTRIB_TYPES.includes(body.type)) {
        errors.push(`type must be one of: ${VALID_CONTRIB_TYPES.join(', ')}`);
    }
    // Title
    if (!body.title || typeof body.title !== 'string' || body.title.trim().length === 0) {
        errors.push('title is required');
    }
    else if (body.title.length > MAX_TITLE_LENGTH) {
        errors.push(`title must be ${MAX_TITLE_LENGTH} characters or fewer`);
    }
    // Description (optional)
    if (body.description && body.description.length > MAX_DESCRIPTION_LENGTH) {
        errors.push(`description must be ${MAX_DESCRIPTION_LENGTH} characters or fewer`);
    }
    // Evidence URLs (optional)
    if (body.evidenceUrls !== undefined) {
        if (!Array.isArray(body.evidenceUrls)) {
            errors.push('evidenceUrls must be an array');
        }
        else if (body.evidenceUrls.length > MAX_EVIDENCE_URLS) {
            errors.push(`evidenceUrls may contain at most ${MAX_EVIDENCE_URLS} items`);
        }
        else if (body.evidenceUrls.some((u) => typeof u !== 'string')) {
            errors.push('all evidenceUrls must be strings');
        }
    }
    // Verification doc URLs (optional)
    if (body.verificationDocUrls !== undefined) {
        if (!Array.isArray(body.verificationDocUrls)) {
            errors.push('verificationDocUrls must be an array');
        }
        else if (body.verificationDocUrls.length > MAX_VERIFICATION_DOCS) {
            errors.push(`verificationDocUrls may contain at most ${MAX_VERIFICATION_DOCS} items`);
        }
        else if (body.verificationDocUrls.some((u) => typeof u !== 'string')) {
            errors.push('all verificationDocUrls must be strings');
        }
    }
    return { valid: errors.length === 0, errors };
}
