"use strict";
// ============================================================
// CuliCars — Section Builder: IMPORT (LOCKED)
// Origin country + Japan auction data + KRA clearance
// ============================================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildImportSection = buildImportSection;
const prisma_1 = __importDefault(require("../../lib/prisma"));
async function buildImportSection(vin) {
    const [vehicle, importEvents] = await Promise.all([
        prisma_1.default.vehicle.findUnique({
            where: { vin },
            select: {
                countryOfOrigin: true,
                importCountry: true,
                isImported: true,
                japanAuctionGrade: true,
                japanAuctionMileage: true,
                kraPin: true,
            },
        }),
        prisma_1.default.vehicleEvent.findMany({
            where: {
                vin,
                eventType: { in: ['IMPORTED', 'KRA_CLEARED', 'AUCTIONED', 'EXPORTED'] },
            },
            select: {
                eventType: true,
                eventDate: true,
                source: true,
                metadata: true,
            },
            orderBy: { eventDate: 'asc' },
        }),
    ]);
    if (!vehicle) {
        return {
            data: {
                originCountry: null,
                importCountry: null,
                isImported: false,
                japanAuction: null,
                kraDetails: { clearanceStatus: null, importDate: null, kraPin: null },
                beForwardData: null,
            },
            recordCount: 0,
            dataStatus: 'not_found',
        };
    }
    // KRA details from events
    const kraEvent = importEvents.find((e) => e.eventType === 'KRA_CLEARED');
    const importEvent = importEvents.find((e) => e.eventType === 'IMPORTED');
    // Japan auction data from events
    const auctionEvent = importEvents.find((e) => e.eventType === 'AUCTIONED');
    const auctionMeta = auctionEvent?.metadata;
    // BE FORWARD data from scraper
    const beForwardEvent = importEvents.find((e) => e.source === 'scraper_beforward');
    const beForwardMeta = beForwardEvent?.metadata;
    const data = {
        originCountry: vehicle.countryOfOrigin,
        importCountry: vehicle.importCountry,
        isImported: vehicle.isImported ?? false,
        japanAuction: vehicle.importCountry === 'JP' || vehicle.countryOfOrigin === 'JP'
            ? {
                grade: vehicle.japanAuctionGrade,
                mileageAtExport: vehicle.japanAuctionMileage,
                auctionHouse: auctionMeta?.auctionHouse || null,
                damageMap: auctionMeta?.damageMap || null,
            }
            : null,
        kraDetails: {
            clearanceStatus: kraEvent ? 'cleared' : null,
            importDate: importEvent
                ? importEvent.eventDate.toISOString().split('T')[0]
                : null,
            kraPin: vehicle.kraPin,
        },
        beForwardData: beForwardMeta || null,
    };
    const recordCount = importEvents.length + (vehicle.isImported ? 1 : 0);
    return {
        data,
        recordCount,
        dataStatus: recordCount > 0 || vehicle.isImported ? 'found' : 'not_found',
    };
}
