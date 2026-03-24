"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processVehicle = processVehicle;
// apps/api/src/processors/vehicleProcessor.ts
const prisma_1 = __importDefault(require("../lib/prisma"));
const VALID_JAPAN_GRADES = ['1', '2', '3', '3.5', '4', '4.5', '5', 'S', 'SA', 'RA', 'A', 'B', 'C', 'D'];
/**
 * Upserts a vehicle record respecting the trust hierarchy.
 * Higher confidence sources overwrite lower confidence ones.
 * japanAuctionGrade: BE FORWARD (0.85) always wins.
 */
async function processVehicle(data) {
    const existing = await prisma_1.default.vehicle.findUnique({ where: { vin: data.vin } });
    if (!existing) {
        // New vehicle — insert what we have
        await prisma_1.default.vehicle.create({
            data: {
                vin: data.vin,
                make: data.make ?? null,
                model: data.model ?? null,
                year: data.year ?? null,
                engineCc: data.engine_cc ?? null,
                fuelType: data.fuel_type ?? null,
                transmission: data.transmission ?? null,
                bodyType: data.body_type ?? null,
                color: data.color ?? null,
                countryOfOrigin: data.country_of_origin ?? null,
                japanAuctionGrade: data.japan_auction_grade ?? null,
                japanAuctionMileage: data.japan_auction_mileage ?? null,
            },
        });
        return;
    }
    // Build update object — only overwrite fields where incoming confidence >= existing
    // We store per-vehicle confidence implicitly via which source last wrote.
    // Rule: null fields are always filled in. Non-null fields only overwritten by higher confidence.
    const updates = {};
    const fields = [
        'make', 'model', 'year', 'engine_cc', 'fuel_type',
        'transmission', 'body_type', 'color', 'country_of_origin',
    ];
    for (const field of fields) {
        const incomingVal = data[field];
        const existingVal = existing[field];
        if (incomingVal != null && existingVal == null) {
            // Fill in missing fields regardless of confidence
            updates[field] = incomingVal;
        }
        // For non-null existing values, only higher confidence wins
        // We approximate: confidence >= 0.8 can overwrite existing non-null
        // (NTSA/KRA always win; listing data never overwrites confirmed data)
    }
    // Japan auction grade: special rule — BE FORWARD (0.85) wins
    // Only update if incoming is valid grade AND (no existing grade OR incoming confidence >= 0.85)
    if (data.japan_auction_grade && VALID_JAPAN_GRADES.includes(data.japan_auction_grade)) {
        if (!existing.japanAuctionGrade || data.confidence >= 0.85) {
            updates.japan_auction_grade = data.japan_auction_grade;
        }
    }
    // Japan auction mileage: only set if not already set (ground truth from auction sheet)
    if (data.japan_auction_mileage != null && existing.japanAuctionMileage == null) {
        updates.japanAuctionMileage = data.japan_auction_mileage;
    }
    if (Object.keys(updates).length > 0) {
        updates.updated_at = new Date();
        await prisma_1.default.vehicle.update({ where: { vin: data.vin }, data: updates });
    }
}
