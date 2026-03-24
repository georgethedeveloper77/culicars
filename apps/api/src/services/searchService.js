"use strict";
// apps/api/src/services/searchService.ts
// Main search orchestrator
// Flow: detect input type → normalize → resolve to VIN → check stolen → return
Object.defineProperty(exports, "__esModule", { value: true });
exports.search = search;
const utils_1 = require("@culicars/utils");
const plateResolver_1 = require("./plateResolver");
const vinDecoder_1 = require("./vinDecoder");
const stolenAlertService_1 = require("./stolenAlertService");
const fuzzyMatcher_1 = require("./fuzzyMatcher");
async function search(rawQuery, options = {}) {
    const { forceType = 'auto' } = options;
    // 1. Detect input type
    let queryType;
    if (forceType === 'plate') {
        queryType = 'plate';
    }
    else if (forceType === 'vin') {
        queryType = 'vin';
    }
    else {
        queryType = (0, utils_1.detectInputType)(rawQuery);
    }
    let candidates = [];
    let normalizedQuery = rawQuery.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    let stolenAlert = { active: false, reportCount: 0, reports: [] };
    let suggestions;
    if (queryType === 'plate') {
        const plateResult = (0, utils_1.normalizePlate)(rawQuery);
        normalizedQuery = plateResult.normalized;
        candidates = await (0, plateResolver_1.resolveByPlate)(plateResult.normalized);
        const vins = candidates.map((c) => c.vin);
        stolenAlert = await (0, stolenAlertService_1.checkVehicle)({ plate: plateResult.normalized, vin: vins[0] ?? null });
        if (candidates.length === 0) {
            suggestions = await (0, fuzzyMatcher_1.getSuggestionStrings)(plateResult.normalized);
        }
    }
    else if (queryType === 'vin') {
        const vinResult = (0, vinDecoder_1.validateAndDecode)(rawQuery);
        normalizedQuery = vinResult.vin;
        if (!vinResult.valid) {
            return {
                query: rawQuery,
                queryType: 'vin',
                normalizedQuery: vinResult.vin,
                candidates: [],
                stolenAlert: { active: false, reportCount: 0, reports: [] },
            };
        }
        candidates = await (0, plateResolver_1.resolveByVin)(vinResult.vin);
        const plate = candidates[0]?.plate ?? null;
        stolenAlert = await (0, stolenAlertService_1.checkVehicle)({ plate, vin: vinResult.vin });
        // If vehicle not in DB but VIN is valid, return VIN decode as virtual candidate
        if (candidates.length === 0 && vinResult.decode) {
            candidates = [
                {
                    vin: vinResult.vin,
                    plate: null,
                    plateDisplay: null,
                    confidence: 0,
                    vehicle: vinResult.decode.make
                        ? {
                            vin: vinResult.vin,
                            make: vinResult.decode.make,
                            model: null,
                            year: vinResult.decode.modelYear ? parseInt(vinResult.decode.modelYear, 10) : null,
                            engineCc: null,
                            fuelType: null,
                            transmission: null,
                            bodyType: null,
                            color: null,
                            countryOfOrigin: vinResult.decode.country,
                            importCountry: null,
                            japanAuctionGrade: null,
                            inspectionStatus: null,
                            ntsaCorVerified: false,
                        }
                        : null,
                    reportId: null,
                    reportStatus: null,
                },
            ];
        }
    }
    else {
        // Unknown — try plate first, then VIN
        const plateResult = (0, utils_1.normalizePlate)(rawQuery);
        if (plateResult.valid) {
            candidates = await (0, plateResolver_1.resolveByPlate)(plateResult.normalized);
            normalizedQuery = plateResult.normalized;
            stolenAlert = await (0, stolenAlertService_1.checkPlate)(plateResult.normalized);
        }
        if (candidates.length === 0) {
            const vinResult = (0, vinDecoder_1.validateAndDecode)(rawQuery);
            if (vinResult.valid) {
                candidates = await (0, plateResolver_1.resolveByVin)(vinResult.vin);
                normalizedQuery = vinResult.vin;
                queryType = 'vin';
                stolenAlert = await (0, stolenAlertService_1.checkVin)(vinResult.vin);
            }
        }
        if (candidates.length === 0 && plateResult.normalized) {
            suggestions = await (0, fuzzyMatcher_1.getSuggestionStrings)(plateResult.normalized);
        }
    }
    return {
        query: rawQuery,
        queryType,
        normalizedQuery,
        candidates,
        stolenAlert,
        suggestions: suggestions?.length ? suggestions : undefined,
    };
}
