"use strict";
// packages/utils/plateNormalizer.ts
// Kenya plate normalizer — all formats → canonical uppercase no-space string
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizePlate = normalizePlate;
exports.isValidKenyaPlate = isValidKenyaPlate;
exports.detectInputType = detectInputType;
function clean(input) {
    return input.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
}
const PATTERNS = [
    { format: 'standard_new', regex: /^(K[A-Z]{2})(\d{3})([A-Z])$/, displayFn: (m) => `${m[1]} ${m[2]}${m[3]}` },
    { format: 'standard_old', regex: /^(K[A-Z]{2})(\d{3})$/, displayFn: (m) => `${m[1]} ${m[2]}` },
    { format: 'government', regex: /^(GK)([A-Z0-9]{3,4})$/, displayFn: (m) => `${m[1]} ${m[2]}` },
    { format: 'military', regex: /^(GN)(\d{4})$/, displayFn: (m) => `${m[1]} ${m[2]}` },
    { format: 'diplomatic', regex: /^(CD)(\d{3}[A-Z]?)$/, displayFn: (m) => `${m[1]} ${m[2]}` },
    { format: 'un', regex: /^(UN)(\d{4})$/, displayFn: (m) => `${m[1]} ${m[2]}` },
];
function normalizePlate(input) {
    const cleaned = clean(input);
    if (!cleaned)
        return { normalized: '', display: '', format: 'unknown', valid: false };
    for (const { format, regex, displayFn } of PATTERNS) {
        const match = cleaned.match(regex);
        if (match) {
            return { normalized: cleaned, display: displayFn(match), format, valid: true };
        }
    }
    return { normalized: cleaned, display: cleaned, format: 'unknown', valid: false };
}
function isValidKenyaPlate(input) {
    return normalizePlate(input).valid;
}
function detectInputType(input) {
    const cleaned = clean(input);
    if (/^[A-HJ-NPR-Z0-9]{17}$/.test(cleaned))
        return 'vin';
    if (/^(K[A-Z]{2}|GK|GN|CD|UN)/.test(cleaned) && cleaned.length >= 5 && cleaned.length <= 8) {
        return 'plate';
    }
    return 'unknown';
}
