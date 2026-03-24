"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KabaScraper = void 0;
// apps/api/src/services/scrapers/kabaScraper.ts
const baseScraper_1 = require("./baseScraper");
class KabaScraper extends baseScraper_1.BaseScraper {
    constructor() {
        super('KABA');
        this.baseUrl = 'https://kaba.co.ke/cars';
    }
    async scrape() {
        const items = [];
        const pages = 3;
        for (let page = 1; page <= pages; page++) {
            try {
                const pageItems = await this.withRetry(() => this.scrapePage(page));
                items.push(...pageItems);
            }
            catch (err) {
                console.error(`[KabaScraper] Failed page ${page}:`, err);
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
        const itemPattern = /<li[^>]*class="[^"]*listing[^"]*"[^>]*>([\s\S]*?)<\/li>/gi;
        const titlePattern = /class="[^"]*title[^"]*"[^>]*>([^<]+)</i;
        const pricePattern = /KSh\s*([\d,]+)/i;
        const mileagePattern = /(\d[\d,]+)\s*(?:km|Km)/i;
        const idPattern = /data-id="([^"]+)"/i;
        const yearPattern = /\b(19[89]\d|20[012]\d)\b/;
        const platePattern = /\b([A-Z]{2,3}\s?\d{3,4}[A-Z]?)\b/i;
        const bazaarDatePattern = /\d{1,2}\s+\w+\s+\d{4}/i;
        for (const match of html.matchAll(itemPattern)) {
            const body = match[1];
            const title = body.match(titlePattern)?.[1]?.trim() ?? null;
            const price_text = body.match(pricePattern)?.[1] ?? null;
            const mileage_text = body.match(mileagePattern)?.[1] ?? null;
            const listing_id = body.match(idPattern)?.[1] ?? null;
            const year = body.match(yearPattern)?.[1]
                ? parseInt(body.match(yearPattern)[1], 10)
                : null;
            const plate_raw = body.match(platePattern)?.[1] ?? null;
            const bazaar_date = body.match(bazaarDatePattern)?.[0] ?? null;
            if (!title)
                continue;
            items.push({
                source: 'KABA',
                vin: null,
                plate: plate_raw,
                rawData: {
                    listing_id,
                    title,
                    price_text,
                    mileage_text,
                    year,
                    bazaar_date,
                    scraped_at: new Date().toISOString(),
                    confidence: 0.5,
                    event_type: 'LISTED_FOR_SALE',
                },
            });
        }
        return items;
    }
}
exports.KabaScraper = KabaScraper;
