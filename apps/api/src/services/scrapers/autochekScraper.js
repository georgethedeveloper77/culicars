"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutochekScraper = void 0;
// apps/api/src/services/scrapers/autochekScraper.ts
const baseScraper_1 = require("./baseScraper");
class AutochekScraper extends baseScraper_1.BaseScraper {
    constructor() {
        super('AUTOCHEK');
        this.apiBase = 'https://api.autochek.africa/v1/inventory/car';
    }
    async scrape() {
        const items = [];
        const pages = 5;
        for (let page = 0; page < pages; page++) {
            try {
                const pageItems = await this.withRetry(() => this.fetchPage(page));
                items.push(...pageItems);
            }
            catch (err) {
                console.error(`[AutochekScraper] Failed page ${page}:`, err);
            }
        }
        return items;
    }
    async fetchPage(page) {
        const url = `${this.apiBase}?country=KE&pageSize=20&pageNumber=${page}`;
        const res = await fetch(url, {
            headers: {
                'User-Agent': this.getUA(),
                Accept: 'application/json',
            },
        });
        if (!res.ok)
            throw new Error(`HTTP ${res.status} from ${url}`);
        const json = await res.json();
        const cars = json.result ?? json.data ?? [];
        return cars.map((car) => ({
            source: 'AUTOCHEK',
            vin: car.vin ?? null,
            plate: null,
            rawData: {
                listing_id: car.id ?? car.carId,
                title: `${car.year ?? ''} ${car.make ?? ''} ${car.model ?? ''}`.trim(),
                make: car.make,
                model: car.model,
                year: car.year,
                mileage_km: car.mileage,
                price_kes: car.marketplacePrice ?? car.sellingPrice,
                vin: car.vin,
                fuel_type: car.fuelType,
                transmission: car.transmission,
                color: car.color,
                image_url: car.imageUrl,
                country: car.country ?? 'KE',
                scraped_at: new Date().toISOString(),
                confidence: 0.5,
                event_type: 'LISTED_FOR_SALE',
            },
        }));
    }
}
exports.AutochekScraper = AutochekScraper;
