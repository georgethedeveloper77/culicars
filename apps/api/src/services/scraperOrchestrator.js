"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerScraper = registerScraper;
exports.getRegisteredSources = getRegisteredSources;
exports.runScraper = runScraper;
const scraperJobService_1 = require("./scraperJobService");
const rawDataProcessor_1 = require("../processors/rawDataProcessor");
const jijiScraper_1 = require("./scrapers/jijiScraper");
const pigiaMeScraper_1 = require("./scrapers/pigiaMeScraper");
const olxScraper_1 = require("./scrapers/olxScraper");
const autochekScraper_1 = require("./scrapers/autochekScraper");
const autosKenyaScraper_1 = require("./scrapers/autosKenyaScraper");
const kabaScraper_1 = require("./scrapers/kabaScraper");
const autoExpressScraper_1 = require("./scrapers/autoExpressScraper");
const kraIbidScraper_1 = require("./scrapers/kraIbidScraper");
const garamScraper_1 = require("./scrapers/garamScraper");
const mogoScraper_1 = require("./scrapers/mogoScraper");
const carDukaScraper_1 = require("./scrapers/carDukaScraper");
const beforwardScraper_1 = require("./scrapers/beforwardScraper");
const SCRAPER_REGISTRY = new Map([
    ['JIJI', () => new jijiScraper_1.JijiScraper()],
    ['PIGIAME', () => new pigiaMeScraper_1.PigiaMeScraper()],
    ['OLX', () => new olxScraper_1.OlxScraper()],
    ['AUTOCHEK', () => new autochekScraper_1.AutochekScraper()],
    ['AUTOSKENYA', () => new autosKenyaScraper_1.AutosKenyaScraper()],
    ['KABA', () => new kabaScraper_1.KabaScraper()],
    ['AUTO_EXPRESS', () => new autoExpressScraper_1.AutoExpressScraper()],
    ['KRA_IBID', () => new kraIbidScraper_1.KraIbidScraper()],
    ['GARAM', () => new garamScraper_1.GaramScraper()],
    ['MOGO', () => new mogoScraper_1.MogoScraper()],
    ['CAR_DUKA', () => new carDukaScraper_1.CarDukaScraper()],
    ['BEFORWARD', () => new beforwardScraper_1.BeforwardScraper()],
]);
function registerScraper(source, factory) {
    SCRAPER_REGISTRY.set(source, factory);
}
function getRegisteredSources() {
    return Array.from(SCRAPER_REGISTRY.keys());
}
/**
 * Runs a single scraper end-to-end:
 * 1. Creates a scraper_jobs record
 * 2. Runs the scraper → RawScrapedItems
 * 3. Saves to scraper_data_raw
 * 4. Triggers rawDataProcessor for this job
 * 5. Updates job record with final counts
 */
async function runScraper(source, trigger = 'manual') {
    const factory = SCRAPER_REGISTRY.get(source);
    if (!factory) {
        throw new Error(`No scraper registered for source: ${source}`);
    }
    const job = await (0, scraperJobService_1.createJob)(source, trigger);
    const jobId = job.id;
    try {
        await (0, scraperJobService_1.updateJob)(jobId, { status: 'running', startedAt: new Date() });
        const scraper = factory();
        const items = await scraper.scrape();
        const items_found = items.length;
        const items_stored = await scraper.saveRaw(items, jobId);
        const items_skipped = items_found - items_stored;
        // Process the raw data immediately after scraping
        const procResult = await (0, rawDataProcessor_1.processJobRawData)(jobId);
        await (0, scraperJobService_1.completeJob)(jobId, { itemsFound: items_found, itemsStored: items_stored, itemsSkipped: items_skipped });
        return {
            jobId,
            source,
            items_found,
            items_stored,
            items_skipped,
            processor_inserted: procResult.inserted,
            processor_skipped: procResult.skipped,
        };
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        await (0, scraperJobService_1.failJob)(jobId, message);
        return {
            jobId,
            source,
            items_found: 0,
            items_stored: 0,
            items_skipped: 0,
            processor_inserted: 0,
            processor_skipped: 0,
            error: message,
        };
    }
}
