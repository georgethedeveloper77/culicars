"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PigiaMeScraper = void 0;
// apps/api/src/services/scrapers/pigiaMeScraper.ts
const baseScraper_1 = require("./baseScraper");
class PigiaMeScraper extends baseScraper_1.BaseScraper {
    constructor() {
        super('PIGIAME');
        this.baseUrl = 'https://pigiame.co.ke/cars-for-sale';
    }
    async scrape() {
        const items = [];
        const pages = 5;
        for (let page = 1; page <= pages; page++) {
            try {
                const pageItems = await this.withRetry(() => this.scrapePage(page));
                items.push(...pageItems);
            }
            catch (err) {
                console.error(`[PigiaMeScraper] Failed page ${page}:`, err);
            }
        }
        return items;
    }
    async scrapePage(page) {
        const url = `${this.baseUrl}?page=${page}`;
        const res = await fetch(url, {
            headers: { 'User-Agent': this.getUA() },
        });
        if (!res.ok)
            throw new Error(`HTTP ${res.status} from ${url}`);
        const html = await res.text();
        return this.parseListings(html);
    }
    parseListings(html) {
        const items = [];
        // PigiaMe uses article tags for listings
        const articlePattern = /<article[^>]*data-adid="([^"]+)"[^>]*>([\s\S]*?)<\/article>/gi;
        const titlePattern = /<h2[^>]*class="[^"]*listing-title[^"]*"[^>]*>([^<]+)</i;
        const pricePattern = /class="[^"]*price[^"]*"[^>]*>([\d,\s]+)/i;
        const mileagePattern = /(\d[\d,]+)\s*km/i;
        const yearPattern = /\b(19[89]\d|20[012]\d)\b/;
        const locationPattern = /class="[^"]*location[^"]*"[^>]*>([^<]+)</i;
        for (const match of html.matchAll(articlePattern)) {
            const [, ad_id, body] = match;
            const title = body.match(titlePattern)?.[1]?.trim() ?? null;
            const price_text = body.match(pricePattern)?.[1]?.trim() ?? null;
            const mileage_text = body.match(mileagePattern)?.[1] ?? null;
            const year = body.match(yearPattern)?.[1] ? parseInt(body.match(yearPattern)[1], 10) : null;
            const location = body.match(locationPattern)?.[1]?.trim() ?? null;
            items.push({
                source: 'PIGIAME',
                vin: null,
                plate: null,
                rawData: {
                    listing_id: ad_id,
                    title,
                    price_text,
                    mileage_text,
                    year,
                    location,
                    scraped_at: new Date().toISOString(),
                    confidence: 0.5,
                    event_type: 'LISTED_FOR_SALE',
                },
            });
        }
        return items;
    }
}
exports.PigiaMeScraper = PigiaMeScraper;
