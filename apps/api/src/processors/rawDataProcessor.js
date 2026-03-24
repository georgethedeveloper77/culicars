"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processJobRawData = processJobRawData;
exports.processAllPending = processAllPending;
// apps/api/src/processors/rawDataProcessor.ts
const prisma_1 = __importDefault(require("../lib/prisma"));
const vinNormalizer_1 = require("./vinNormalizer");
const serviceRecordProcessor_1 = require("./serviceRecordProcessor");
const listingProcessor_1 = require("./listingProcessor");
const auctionProcessor_1 = require("./auctionProcessor");
const LISTING_SOURCES = new Set(['JIJI', 'PIGIAME', 'OLX', 'AUTOCHEK', 'AUTOSKENYA', 'KABA']);
const AUCTION_SOURCES = new Set(['KRA_IBID', 'GARAM', 'MOGO', 'CAR_DUKA', 'BEFORWARD']);
const SERVICE_SOURCES = new Set(['AUTO_EXPRESS']);
/**
 * Processes all unprocessed rows for a given job.
 * Routes each row to the correct sub-processor based on source.
 * Marks rows as processed=true after handling (success or error).
 */
async function processJobRawData(jobId) {
    const result = { processed: 0, inserted: 0, skipped: 0, errors: 0 };
    const batch = await prisma_1.default.scraperDataRaw.findMany({
        where: { jobId: jobId, processed: false },
        orderBy: { createdAt: 'asc' },
    });
    for (const row of batch) {
        try {
            const raw = row.rawData;
            const resolvedVin = (0, vinNormalizer_1.normalizeVin)(row.vin ?? raw.vin);
            const source = row.source.toUpperCase();
            let wasInserted = false;
            if (SERVICE_SOURCES.has(source)) {
                wasInserted = await (0, serviceRecordProcessor_1.processServiceRecord)(raw, resolvedVin);
            }
            else if (LISTING_SOURCES.has(source)) {
                wasInserted = await (0, listingProcessor_1.processListing)({ ...raw, source }, resolvedVin);
            }
            else if (AUCTION_SOURCES.has(source)) {
                wasInserted = await (0, auctionProcessor_1.processAuction)({ ...raw, source }, resolvedVin);
            }
            else {
                // Unknown source — mark processed but skip
                wasInserted = false;
            }
            if (wasInserted) {
                result.inserted++;
            }
            else {
                result.skipped++;
            }
            // Mark as processed regardless of outcome
            await prisma_1.default.scraperDataRaw.update({
                where: { id: row.id },
                data: { processed: true, processedAt: new Date() },
            });
            result.processed++;
        }
        catch (err) {
            result.errors++;
            console.error(`[rawDataProcessor] Error processing row ${row.id}:`, err);
            // Still mark as processed to avoid infinite retry loops
            await prisma_1.default.scraperDataRaw.update({
                where: { id: row.id },
                data: { processed: true, processedAt: new Date() },
            }).catch(() => { });
        }
    }
    return result;
}
/**
 * Processes all unprocessed raw data across all jobs.
 * Used by scheduled tasks or admin triggers.
 */
async function processAllPending() {
    const result = { processed: 0, inserted: 0, skipped: 0, errors: 0 };
    const pendingJobs = await prisma_1.default.scraperDataRaw
        .groupBy({ by: ['jobId'], where: { processed: false } });
    for (const { jobId } of pendingJobs) {
        const jobResult = await processJobRawData(jobId);
        result.processed += jobResult.processed;
        result.inserted += jobResult.inserted;
        result.skipped += jobResult.skipped;
        result.errors += jobResult.errors;
    }
    return result;
}
