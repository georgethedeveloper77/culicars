"use strict";
// ============================================================
// CuliCars — Thread 4: VIN Extractor
// ============================================================
// Extracts 17-character VINs from raw OCR text.
// Validates against ISO 3779 (check digit + WMI).
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractVins = extractVins;
const utils_1 = require("@culicars/utils");
/**
 * VIN characters: A-Z (excluding I, O, Q) + 0-9
 * Total length: exactly 17
 */
const VIN_CHAR_CLASS = '[A-HJ-NPR-Z0-9]';
const VIN_REGEX = new RegExp(`\\b(${VIN_CHAR_CLASS}{17})\\b`, 'gi');
/**
 * Looser pattern: allows spaces/dashes within VIN (common in OCR)
 */
const VIN_LOOSE_REGEX = new RegExp(`\\b(${VIN_CHAR_CLASS}{3}[\\s-]?${VIN_CHAR_CLASS}{6}[\\s-]?${VIN_CHAR_CLASS}{8})\\b`, 'gi');
/**
 * Extract all VINs from OCR text.
 * Returns sorted by confidence (valid VINs first).
 */
function extractVins(ocrText) {
    if (!ocrText || !ocrText.trim())
        return [];
    const results = [];
    const seen = new Set();
    const cleanedText = cleanForVin(ocrText);
    // Try strict pattern first
    extractWithPattern(VIN_REGEX, cleanedText, 0.9, results, seen);
    // Then try loose pattern (with spaces/dashes)
    extractWithPattern(VIN_LOOSE_REGEX, cleanedText, 0.75, results, seen);
    // Sort: valid VINs first, then by confidence
    return results.sort((a, b) => {
        if (a.isValid !== b.isValid)
            return a.isValid ? -1 : 1;
        return b.confidence - a.confidence;
    });
}
function extractWithPattern(regex, text, baseConfidence, results, seen) {
    regex.lastIndex = 0;
    let match;
    while ((match = regex.exec(text)) !== null) {
        const raw = match[1];
        const cleaned = raw.replace(/[\s-]/g, '').toUpperCase();
        // Must be exactly 17 chars after cleaning
        if (cleaned.length !== 17)
            continue;
        if (seen.has(cleaned))
            continue;
        seen.add(cleaned);
        // Validate with ISO 3779 check digit
        const isValid = (0, utils_1.validateVin)(cleaned);
        // Adjust confidence
        let confidence = baseConfidence;
        if (isValid)
            confidence = Math.min(confidence + 0.1, 1.0);
        if (!isValid)
            confidence -= 0.15;
        // Boost if near VIN-related keywords
        const matchIdx = match.index;
        const surrounding = text
            .slice(Math.max(0, matchIdx - 100), matchIdx + raw.length + 100)
            .toLowerCase();
        const boostKeywords = [
            'vin',
            'chassis',
            'vehicle identification',
            'frame no',
            'frame number',
            'chassis no',
            'chassis number',
        ];
        if (boostKeywords.some((kw) => surrounding.includes(kw))) {
            confidence = Math.min(confidence + 0.05, 1.0);
        }
        results.push({
            value: cleaned,
            confidence: Math.max(0, Math.min(1, confidence)),
            raw,
            isValid: isValid.valid,
        });
    }
}
/**
 * Clean OCR text for VIN extraction.
 * Handle common OCR misreads in VIN context.
 */
function cleanForVin(text) {
    return (text
        // In VIN context, 'O' is often misread as '0' and vice versa
        // We keep both and let validation sort it out
        .replace(/\s+/g, ' ')
        .trim());
}
