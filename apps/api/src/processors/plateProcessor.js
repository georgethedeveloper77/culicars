"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processPlate = processPlate;
exports.normalizePlate = normalizePlate;
exports.formatPlate = formatPlate;
// apps/api/src/processors/plateProcessor.ts
const prisma_1 = __importDefault(require("../lib/prisma"));
/**
 * Upserts plate_vin_map.
 * Higher confidence sources update the existing record.
 * One VIN can have multiple plates (re-registration).
 */
async function processPlate(data) {
    const existing = await prisma_1.default.plateVinMap.findFirst({
        where: { plate: data.plate, vin: data.vin },
    });
    if (!existing) {
        await prisma_1.default.plateVinMap.create({
            data: {
                plate: data.plate,
                plateDisplay: data.plateDisplay,
                vin: data.vin,
                confidence: data.confidence,
                source: data.source,
                verifiedAt: data.confidence >= 0.9 ? new Date() : null,
            },
        });
        return;
    }
    // Only update if incoming confidence is higher
    if (data.confidence > (existing.confidence ?? 0)) {
        await prisma_1.default.plateVinMap.update({
            where: { id: existing.id },
            data: {
                confidence: data.confidence,
                source: data.source,
                verifiedAt: data.confidence >= 0.9 ? new Date() : existing.verifiedAt,
            },
        });
    }
}
/**
 * Normalize a Kenya plate to canonical form: 'KCA123A'
 */
function normalizePlate(raw) {
    return raw.replace(/\s+/g, '').toUpperCase();
}
/**
 * Format a normalized plate for display: 'KCA 123A'
 */
function formatPlate(normalized) {
    // KXX 000X pattern
    const match = normalized.match(/^([A-Z]{2,3})(\d{3,4})([A-Z]?)$/);
    if (match) {
        return match[3] ? `${match[1]} ${match[2]}${match[3]}` : `${match[1]} ${match[2]}`;
    }
    // GK XXXX, CD XXX patterns
    const govMatch = normalized.match(/^(GK|GN|CD|UN)(\d+)$/);
    if (govMatch)
        return `${govMatch[1]} ${govMatch[2]}`;
    return normalized;
}
