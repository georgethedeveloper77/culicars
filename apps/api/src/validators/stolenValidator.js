"use strict";
// apps/api/src/validators/stolenValidator.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateStolenSubmission = validateStolenSubmission;
exports.validateRecoverySubmission = validateRecoverySubmission;
const VALID_REPORTER_TYPES = ['owner', 'family', 'witness', 'police'];
const MAX_PHOTO_URLS = 5;
// 47 Kenya counties
const KENYA_COUNTIES = new Set([
    'Mombasa', 'Kwale', 'Kilifi', 'Tana River', 'Lamu', 'Taita Taveta', 'Garissa', 'Wajir', 'Mandera',
    'Marsabit', 'Isiolo', 'Meru', 'Tharaka-Nithi', 'Embu', 'Kitui', 'Machakos', 'Makueni', 'Nyandarua',
    'Nyeri', 'Kirinyaga', 'Murang\'a', 'Kiambu', 'Turkana', 'West Pokot', 'Samburu', 'Trans Nzoia',
    'Uasin Gishu', 'Elgeyo-Marakwet', 'Nandi', 'Baringo', 'Laikipia', 'Nakuru', 'Narok', 'Kajiado',
    'Kericho', 'Bomet', 'Kakamega', 'Vihiga', 'Bungoma', 'Busia', 'Siaya', 'Kisumu', 'Homa Bay',
    'Migori', 'Kisii', 'Nyamira', 'Nairobi',
]);
function validateStolenSubmission(body) {
    const errors = [];
    // Plate
    if (!body.plate || typeof body.plate !== 'string' || body.plate.trim().length === 0) {
        errors.push('plate is required');
    }
    // VIN (optional)
    if (body.vin !== undefined && body.vin !== null && body.vin !== '') {
        if (!/^[A-HJ-NPR-Z0-9]{17}$/i.test(body.vin)) {
            errors.push('vin must be a valid 17-character VIN if provided');
        }
    }
    // Date stolen
    if (!body.dateStolenIso) {
        errors.push('dateStolenIso is required');
    }
    else {
        const d = new Date(body.dateStolenIso);
        if (isNaN(d.getTime())) {
            errors.push('dateStolenIso must be a valid date (YYYY-MM-DD)');
        }
        else if (d > new Date()) {
            errors.push('dateStolenIso cannot be in the future');
        }
    }
    // County
    if (!body.countyStolen || typeof body.countyStolen !== 'string') {
        errors.push('countyStolen is required');
    }
    else if (!KENYA_COUNTIES.has(body.countyStolen)) {
        errors.push('countyStolen must be a valid Kenya county');
    }
    // Town
    if (!body.townStolen || typeof body.townStolen !== 'string' || body.townStolen.trim().length === 0) {
        errors.push('townStolen is required');
    }
    // Car color
    if (!body.carColor || typeof body.carColor !== 'string' || body.carColor.trim().length === 0) {
        errors.push('carColor is required');
    }
    // Reporter type
    if (!body.reporterType) {
        errors.push('reporterType is required');
    }
    else if (!VALID_REPORTER_TYPES.includes(body.reporterType)) {
        errors.push(`reporterType must be one of: ${VALID_REPORTER_TYPES.join(', ')}`);
    }
    // Contact: at least one required
    const hasContact = (body.contactPhone && body.contactPhone.trim().length > 0) ||
        (body.contactEmail && body.contactEmail.trim().length > 0);
    if (!hasContact) {
        errors.push('At least one of contactPhone or contactEmail is required');
    }
    // Photos (optional)
    if (body.photoUrls !== undefined) {
        if (!Array.isArray(body.photoUrls)) {
            errors.push('photoUrls must be an array');
        }
        else if (body.photoUrls.length > MAX_PHOTO_URLS) {
            errors.push(`photoUrls may contain at most ${MAX_PHOTO_URLS} items`);
        }
    }
    return { valid: errors.length === 0, errors };
}
function validateRecoverySubmission(body) {
    const errors = [];
    if (!body.recoveryDate) {
        errors.push('recoveryDate is required');
    }
    else {
        const d = new Date(body.recoveryDate);
        if (isNaN(d.getTime())) {
            errors.push('recoveryDate must be a valid date (YYYY-MM-DD)');
        }
        else if (d > new Date()) {
            errors.push('recoveryDate cannot be in the future');
        }
    }
    if (!body.recoveryCounty || typeof body.recoveryCounty !== 'string') {
        errors.push('recoveryCounty is required');
    }
    else if (!KENYA_COUNTIES.has(body.recoveryCounty)) {
        errors.push('recoveryCounty must be a valid Kenya county');
    }
    return { valid: errors.length === 0, errors };
}
