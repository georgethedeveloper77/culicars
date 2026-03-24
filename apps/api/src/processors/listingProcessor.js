"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processListing = processListing;
// apps/api/src/processors/listingProcessor.ts
const eventProcessor_1 = require("./eventProcessor");
const vehicleProcessor_1 = require("./vehicleProcessor");
const plateProcessor_1 = require("./plateProcessor");
const vinNormalizer_1 = require("./vinNormalizer");
const SOURCE_MAP = {
    JIJI: 'scraper_jiji',
    PIGIAME: 'scraper_pigiame',
    OLX: 'scraper_olx',
    AUTOCHEK: 'scraper_autochek',
    AUTOSKENYA: 'scraper_autoskenya',
    KABA: 'scraper_kaba',
};
function parseMileage(raw) {
    if (raw.mileage_km != null)
        return raw.mileage_km;
    if (!raw.mileage_text)
        return null;
    const n = parseInt(raw.mileage_text.replace(/,/g, ''), 10);
    return isNaN(n) ? null : n;
}
function extractMakeModel(title) {
    if (!title)
        return { make: null, model: null };
    // Typical format: "2014 Toyota Fielder" or "Toyota Land Cruiser 2018"
    const yearStripped = title.replace(/\b(19|20)\d{2}\b/, '').trim();
    const parts = yearStripped.split(/\s+/);
    return {
        make: parts[0] ?? null,
        model: parts.slice(1).join(' ') || null,
    };
}
/**
 * Processes listing data into LISTED_FOR_SALE vehicle_events.
 * Also upserts vehicle and plate records if sufficient data exists.
 */
async function processListing(raw, resolvedVin) {
    const vin = resolvedVin ?? (0, vinNormalizer_1.normalizeVin)(raw.vin);
    if (!vin)
        return false;
    const confidence = raw.confidence ?? 0.5;
    const eventSource = SOURCE_MAP[raw.source] ?? `scraper_${raw.source.toLowerCase()}`;
    const mileage_km = parseMileage(raw);
    const scrapedDate = raw.scraped_at ? new Date(raw.scraped_at) : new Date();
    // Try to parse make/model from title if not explicit
    const { make: titleMake, model: titleModel } = extractMakeModel(raw.title ?? null);
    // Upsert vehicle with listing data
    const vehicleData = {
        vin,
        make: raw.make ?? titleMake,
        model: raw.model ?? titleModel,
        year: raw.year ?? null,
        fuel_type: raw.fuel_type ?? null,
        transmission: raw.transmission ?? null,
        color: raw.color ?? null,
        confidence,
    };
    await (0, vehicleProcessor_1.processVehicle)(vehicleData);
    // Upsert plate if present
    if (raw.plate) {
        const normalized = (0, plateProcessor_1.normalizePlate)(raw.plate);
        await (0, plateProcessor_1.processPlate)({
            plate: normalized,
            plateDisplay: (0, plateProcessor_1.formatPlate)(normalized),
            vin,
            confidence,
            source: eventSource,
        });
    }
    // Insert LISTED_FOR_SALE event
    const inserted = await (0, eventProcessor_1.insertEvent)({
        vin,
        eventType: 'LISTED_FOR_SALE',
        eventDate: scrapedDate,
        country: 'KE',
        source: eventSource,
        source_ref: raw.listing_id ?? null,
        confidence,
        metadata: {
            listing_id: raw.listing_id,
            title: raw.title,
            price_text: raw.price_text,
            price_kes: raw.price_kes,
            mileage_km,
            location: raw.location,
            image_url: raw.image_url,
        },
    });
    return inserted;
}
