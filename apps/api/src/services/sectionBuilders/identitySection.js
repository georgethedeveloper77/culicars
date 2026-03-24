"use strict";
// ============================================================
// CuliCars — Section Builder: IDENTITY (FREE)
// VIN decode + basic specs + associated plates
// ============================================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildIdentitySection = buildIdentitySection;
const prisma_1 = __importDefault(require("../../lib/prisma"));
async function buildIdentitySection(vin) {
    const [vehicle, plates] = await Promise.all([
        prisma_1.default.vehicle.findUnique({
            where: { vin },
            select: {
                vin: true,
                make: true,
                model: true,
                year: true,
                engineCc: true,
                fuelType: true,
                transmission: true,
                bodyType: true,
                color: true,
                countryOfOrigin: true,
                chassisNumber: true,
                ntsaCorVerified: true,
            },
        }),
        prisma_1.default.plateVinMap.findMany({
            where: { vin },
            select: {
                plate: true,
                plateDisplay: true,
                confidence: true,
                source: true,
            },
            orderBy: { confidence: 'desc' },
        }),
    ]);
    if (!vehicle) {
        return {
            data: {
                vin,
                make: null,
                model: null,
                year: null,
                engineCc: null,
                fuelType: null,
                transmission: null,
                bodyType: null,
                color: null,
                countryOfOrigin: null,
                chassisNumber: null,
                ntsaCorVerified: false,
                plates: [],
            },
            recordCount: 0,
            dataStatus: 'not_found',
        };
    }
    return {
        data: {
            vin: vehicle.vin,
            make: vehicle.make,
            model: vehicle.model,
            year: vehicle.year,
            engineCc: vehicle.engineCc,
            fuelType: vehicle.fuelType,
            transmission: vehicle.transmission,
            bodyType: vehicle.bodyType,
            color: vehicle.color,
            countryOfOrigin: vehicle.countryOfOrigin,
            chassisNumber: vehicle.chassisNumber,
            ntsaCorVerified: vehicle.ntsaCorVerified ?? false,
            plates: plates.map((p) => ({
                plate: p.plate,
                plateDisplay: p.plateDisplay ?? p.plate,
                confidence: p.confidence ?? 0.5,
                source: p.source ?? 'unknown',
            })),
        },
        recordCount: 1 + plates.length,
        dataStatus: 'found',
    };
}
