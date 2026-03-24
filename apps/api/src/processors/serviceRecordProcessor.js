"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processServiceRecord = processServiceRecord;
// apps/api/src/processors/serviceRecordProcessor.ts
const eventProcessor_1 = require("./eventProcessor");
const plateProcessor_1 = require("./plateProcessor");
const vinNormalizer_1 = require("./vinNormalizer");
function parseMileage(text) {
    if (!text)
        return null;
    const n = parseInt(text.replace(/,/g, ''), 10);
    return isNaN(n) ? null : n;
}
function parseDate(raw) {
    if (!raw)
        return null;
    const normalized = raw.replace(/\//g, '-');
    const d = new Date(normalized);
    return isNaN(d.getTime()) ? null : d;
}
/**
 * Processes Auto Express service records into SERVICED vehicle_events.
 * Each service record with mileage also contributes to odometer history.
 */
async function processServiceRecord(raw, resolvedVin) {
    const vin = resolvedVin ?? (0, vinNormalizer_1.normalizeVin)(raw.vin);
    if (!vin)
        return false;
    const event_date = parseDate(raw.service_date) ?? new Date();
    const mileage_km = parseMileage(raw.mileage_text);
    const confidence = raw.confidence ?? 0.8;
    const metadata = {
        garage_name: raw.garage_name ?? null,
        work_done: raw.work_done ?? null,
        mileage_km,
        plate: raw.plate ? (0, plateProcessor_1.normalizePlate)(raw.plate) : null,
    };
    const inserted = await (0, eventProcessor_1.insertEvent)({
        vin,
        eventType: 'SERVICED',
        eventDate: event_date,
        country: 'KE',
        source: 'scraper_autoexpress',
        source_ref: raw.record_id ?? null,
        confidence,
        metadata,
    });
    return inserted;
}
