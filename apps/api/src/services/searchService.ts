// apps/api/src/services/searchService.ts
// Main search orchestrator
// Flow: detect input type → normalize → resolve to VIN → check stolen → return

import { normalizePlate, detectInputType } from '@culicars/utils';
import { resolveByPlate, resolveByVin } from './plateResolver';
import { validateAndDecode } from './vinDecoder';
import { checkStolen, checkStolenByPlate, checkStolenByVin } from './stolenAlertService';
import { getSuggestionStrings } from './fuzzyMatcher';
import type { SearchResponse, SearchCandidate, StolenAlert, SearchType } from '../types/search.types';

interface SearchOptions {
  forceType?: SearchType;
}

export async function search(
  rawQuery: string,
  options: SearchOptions = {}
): Promise<SearchResponse> {
  const { forceType = 'auto' } = options;

  // 1. Detect input type
  let queryType: 'plate' | 'vin' | 'unknown';
  if (forceType === 'plate') {
    queryType = 'plate';
  } else if (forceType === 'vin') {
    queryType = 'vin';
  } else {
    queryType = detectInputType(rawQuery);
  }

  let candidates: SearchCandidate[] = [];
  let normalizedQuery = rawQuery.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  let stolenAlert: StolenAlert = { active: false, reportCount: 0, reports: [] };
  let suggestions: string[] | undefined;

  if (queryType === 'plate') {
    const plateResult = normalizePlate(rawQuery);
    normalizedQuery = plateResult.normalized;

    candidates = await resolveByPlate(plateResult.normalized);

    const vins = candidates.map((c) => c.vin);
    stolenAlert = await checkStolen(plateResult.normalized, vins[0] ?? null);

    if (candidates.length === 0) {
      suggestions = await getSuggestionStrings(plateResult.normalized);
    }
  } else if (queryType === 'vin') {
    const vinResult = validateAndDecode(rawQuery);
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

    candidates = await resolveByVin(vinResult.vin);

    const plate = candidates[0]?.plate ?? null;
    stolenAlert = await checkStolen(plate, vinResult.vin);

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
  } else {
    // Unknown — try plate first, then VIN
    const plateResult = normalizePlate(rawQuery);
    if (plateResult.valid) {
      candidates = await resolveByPlate(plateResult.normalized);
      normalizedQuery = plateResult.normalized;
      stolenAlert = await checkStolenByPlate(plateResult.normalized);
    }

    if (candidates.length === 0) {
      const vinResult = validateAndDecode(rawQuery);
      if (vinResult.valid) {
        candidates = await resolveByVin(vinResult.vin);
        normalizedQuery = vinResult.vin;
        queryType = 'vin';
        stolenAlert = await checkStolenByVin(vinResult.vin);
      }
    }

    if (candidates.length === 0 && plateResult.normalized) {
      suggestions = await getSuggestionStrings(plateResult.normalized);
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
