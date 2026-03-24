"use strict";
// apps/api/src/processors/vinNormalizer.ts
/**
 * VIN normalizer — clean and validate VINs extracted from raw scraper data.
 * ISO 3779: 17 chars, no I/O/Q, valid check digit.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeVin = normalizeVin;
exports.validateVinCheckDigit = validateVinCheckDigit;
exports.extractVinFromText = extractVinFromText;
const VIN_REGEX = /^[A-HJ-NPR-Z0-9]{17}$/i;
// Check digit weights and transliteration table
const TRANSLITERATION = {
    A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8,
    J: 1, K: 2, L: 3, M: 4, N: 5, P: 7, R: 9,
    S: 2, T: 3, U: 4, V: 5, W: 6, X: 7, Y: 8, Z: 9,
    '0': 0, '1': 1, '2': 2, '3': 3, '4': 4,
    '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
};
const POSITION_WEIGHTS = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];
function normalizeVin(raw) {
    if (!raw)
        return null;
    // Strip whitespace, dashes, and convert to uppercase
    const cleaned = raw.replace(/[\s\-]/g, '').toUpperCase();
    if (!VIN_REGEX.test(cleaned))
        return null;
    return cleaned;
}
function validateVinCheckDigit(vin) {
    if (!VIN_REGEX.test(vin))
        return false;
    let sum = 0;
    for (let i = 0; i < 17; i++) {
        const char = vin[i];
        const value = TRANSLITERATION[char];
        if (value === undefined)
            return false;
        sum += value * POSITION_WEIGHTS[i];
    }
    const remainder = sum % 11;
    const checkDigit = vin[8];
    const expected = remainder === 10 ? 'X' : String(remainder);
    return checkDigit === expected;
}
function extractVinFromText(text) {
    const matches = text.match(/\b[A-HJ-NPR-Z0-9]{17}\b/gi);
    if (!matches)
        return null;
    for (const match of matches) {
        const normalized = normalizeVin(match);
        if (normalized)
            return normalized;
    }
    return null;
}
