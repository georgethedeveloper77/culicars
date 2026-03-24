"use strict";
// ============================================================
// CuliCars — Thread 4: Chassis Extractor
// ============================================================
// Extracts chassis/frame numbers from OCR text.
// Kenya logbooks often show chassis separate from VIN.
// Common format: alphanumeric, 7-17 chars, hyphen-separated.
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractChassis = extractChassis;
/**
 * Chassis number patterns common in Kenya logbooks and NTSA documents.
 * Chassis can be:
 *  - Full 17-char VIN used as chassis
 *  - Shorter manufacturer-specific frame numbers (e.g., NZE141-6012345)
 *  - Alphanumeric with hyphens
 */
const CHASSIS_PATTERNS = [
    // Toyota-style: ABC123-1234567 (3-6 alpha/num prefix, hyphen, 7 digits)
    {
        regex: /\b([A-Z]{2,6}\d{2,4})-(\d{6,8})\b/gi,
        baseConfidence: 0.85,
    },
    // Nissan/Honda-style: AB12-123456
    {
        regex: /\b([A-Z]{1,4}\d{1,4})-(\d{5,8})\b/gi,
        baseConfidence: 0.8,
    },
    // Generic alphanumeric chassis: 8-17 chars, at least 1 letter + 1 digit
    {
        regex: /\b([A-Z0-9]{8,17})\b/gi,
        baseConfidence: 0.6,
    },
];
/**
 * Extract chassis/frame numbers from OCR text.
 * Only considers text near chassis-related keywords to reduce false positives.
 */
function extractChassis(ocrText) {
    if (!ocrText || !ocrText.trim())
        return [];
    const results = [];
    const seen = new Set();
    // First pass: look for chassis numbers near relevant keywords
    const segments = findChassisSegments(ocrText);
    for (const segment of segments) {
        for (const { regex, baseConfidence } of CHASSIS_PATTERNS) {
            regex.lastIndex = 0;
            let match;
            while ((match = regex.exec(segment.text)) !== null) {
                const raw = match[0];
                const normalized = raw.replace(/[\s-]/g, '').toUpperCase();
                if (normalized.length < 7 || normalized.length > 17)
                    continue;
                if (seen.has(normalized))
                    continue;
                // Must contain both letters and numbers
                if (!/[A-Z]/.test(normalized) || !/\d/.test(normalized))
                    continue;
                seen.add(normalized);
                const confidence = Math.min(baseConfidence + segment.keywordBoost, 1.0);
                results.push({
                    value: normalized,
                    confidence,
                    raw,
                });
            }
        }
    }
    return results.sort((a, b) => b.confidence - a.confidence);
}
/**
 * Find text segments near chassis-related keywords.
 * Returns segments with confidence boosts.
 */
function findChassisSegments(text) {
    const keywords = [
        { term: 'chassis', boost: 0.1 },
        { term: 'chassis no', boost: 0.12 },
        { term: 'chassis number', boost: 0.12 },
        { term: 'frame no', boost: 0.1 },
        { term: 'frame number', boost: 0.1 },
        { term: 'body no', boost: 0.08 },
    ];
    const segments = [];
    const lowerText = text.toLowerCase();
    for (const { term, boost } of keywords) {
        let searchIdx = 0;
        while (true) {
            const idx = lowerText.indexOf(term, searchIdx);
            if (idx === -1)
                break;
            // Extract ~150 chars after the keyword
            const start = idx;
            const end = Math.min(text.length, idx + term.length + 150);
            segments.push({
                text: text.slice(start, end),
                keywordBoost: boost,
            });
            searchIdx = idx + term.length;
        }
    }
    // If no keyword segments found, scan the whole text with lower confidence
    if (segments.length === 0) {
        segments.push({ text, keywordBoost: 0 });
    }
    return segments;
}
