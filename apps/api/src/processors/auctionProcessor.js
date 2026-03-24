"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processAuction = processAuction;
// apps/api/src/processors/auctionProcessor.ts
const eventProcessor_1 = require("./eventProcessor");
const vehicleProcessor_1 = require("./vehicleProcessor");
const vinNormalizer_1 = require("./vinNormalizer");
const SOURCE_MAP = {
    KRA_IBID: 'scraper_kra_ibid',
    GARAM: 'scraper_auction',
    MOGO: 'scraper_auction',
    CAR_DUKA: 'scraper_auction',
    BEFORWARD: 'scraper_beforward',
};
function parseDate(raw) {
    if (!raw)
        return null;
    const d = new Date(raw.replace(/\//g, '-'));
    return isNaN(d.getTime()) ? null : d;
}
function parseMileage(raw) {
    if (raw.mileage_km_at_export != null)
        return raw.mileage_km_at_export;
    if (!raw.mileage_text)
        return null;
    const n = parseInt(raw.mileage_text.replace(/,/g, ''), 10);
    return isNaN(n) ? null : n;
}
/**
 * Processes auction data into AUCTIONED vehicle_events.
 * Also upserts vehicle with auction-sourced data including japan_auction_grade.
 * Damage events created separately if has_damage=true.
 */
async function processAuction(raw, resolvedVin) {
    const vin = resolvedVin ?? (0, vinNormalizer_1.normalizeVin)(raw.vin);
    if (!vin)
        return false;
    const confidence = raw.confidence ?? 0.75;
    const eventSource = SOURCE_MAP[raw.source] ?? `scraper_${raw.source.toLowerCase()}`;
    const auction_date = parseDate(raw.auction_date) ?? new Date();
    const mileage_km = parseMileage(raw);
    // Upsert vehicle — BE FORWARD grade wins (0.85 > 0.75)
    const vehicleData = {
        vin,
        make: raw.make ?? null,
        model: raw.model ?? null,
        year: raw.year ?? null,
        engine_cc: raw.engine_cc ?? null,
        transmission: raw.transmission ?? null,
        color: raw.color ?? null,
        japan_auction_grade: raw.japan_auction_grade ?? null,
        japan_auction_mileage: raw.source === 'BEFORWARD' ? (mileage_km ?? null) : null,
        confidence,
    };
    await (0, vehicleProcessor_1.processVehicle)(vehicleData);
    // Insert AUCTIONED event
    const inserted = await (0, eventProcessor_1.insertEvent)({
        vin,
        eventType: 'AUCTIONED',
        eventDate: auction_date,
        country: raw.source === 'BEFORWARD' ? 'JP' : 'KE',
        county: raw.port ?? null,
        source: eventSource,
        source_ref: raw.lot_number ?? null,
        confidence,
        metadata: {
            lot_number: raw.lot_number,
            make: raw.make,
            model: raw.model,
            year: raw.year,
            mileage_km,
            japan_auction_grade: raw.japan_auction_grade,
            port: raw.port,
            bank_name: raw.bank_name,
            condition: raw.condition,
            damage_description: raw.damage_description,
            damage_locations: raw.damage_locations ?? [],
            image_urls: raw.image_urls ?? (raw.primary_image ? [raw.primary_image] : []),
            price_usd: raw.price_usd,
            reserve_price_text: raw.reserve_price_text,
        },
    });
    // If damage present, also insert a DAMAGED event
    if (raw.has_damage && raw.damage_description) {
        await (0, eventProcessor_1.insertEvent)({
            vin,
            eventType: 'DAMAGED',
            eventDate: auction_date,
            country: raw.source === 'BEFORWARD' ? 'JP' : 'KE',
            source: eventSource,
            source_ref: raw.lot_number ? `dmg_${raw.lot_number}` : null,
            confidence,
            metadata: {
                description: raw.damage_description,
                damage_locations: raw.damage_locations ?? [],
                source_type: 'auction_sheet',
            },
        });
    }
    return inserted;
}
