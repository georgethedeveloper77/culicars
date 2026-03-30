// apps/api/src/services/searchService.ts
// Main search orchestrator
// Flow: detect input type → normalize → resolve to VIN → check stolen → return

import { normalizePlate, detectInputType } from '@culicars/utils';
import { resolveByPlate, resolveByVin } from './plateResolver';
import { validateAndDecode } from './vinDecoder';
import { checkVehicle, checkPlate, checkVin } from './stolenAlertService';
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
    stolenAlert = await checkVehicle({ plate: plateResult.normalized, vin: vins[0] ?? null }) as any;

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
    stolenAlert = await checkVehicle({ plate, vin: vinResult.vin }) as any;

    // If vehicle not in DB but VIN is valid, return VIN decode as virtual candidate
    if (candidates.length === 0 && vinResult.decode) {
      candidates = [
        {
          vin: vinResult.vin,
          plate: null,
          plate_display: null,
          confidence: 0,
          vehicle: vinResult.decode.make
            ? {
                vin: vinResult.vin,
                make: vinResult.decode.make,
                model: null,
                year: vinResult.decode.modelYear ? parseInt(vinResult.decode.modelYear, 10) : null,
                engine_cc: null,
                fuel_type: null,
                transmission: null,
                body_type: null,
                color: null,
                country_of_origin: vinResult.decode.country,
                import_country: null,
                japan_auction_grade: null,
                inspection_status: null,
                ntsa_cor_verified: false,
              }
            : null,
          report_id: null,
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
      stolenAlert = await checkPlate(plateResult.normalized) as any;
    }

    if (candidates.length === 0) {
      const vinResult = validateAndDecode(rawQuery);
      if (vinResult.valid) {
        candidates = await resolveByVin(vinResult.vin);
        normalizedQuery = vinResult.vin;
        queryType = 'vin';
        stolenAlert = await checkVin(vinResult.vin) as any;
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
