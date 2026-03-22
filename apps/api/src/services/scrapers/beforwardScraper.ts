// apps/api/src/services/scrapers/beforwardScraper.ts
import { BaseScraper, RawScrapedItem } from './baseScraper';

/**
 * BE FORWARD Japan scraper.
 * Provides: Japan auction grade (3–5), pre-export mileage, damage location map, photos.
 * Confidence: 0.85 (auction sheet data — highly reliable).
 * Japan auction grade from BE FORWARD WINS over all other sources.
 */
export class BeforwardScraper extends BaseScraper {
  private baseUrl = 'https://www.beforward.jp';

  constructor() {
    super('BEFORWARD');
  }

  async scrape(): Promise<RawScrapedItem[]> {
    const items: RawScrapedItem[] = [];

    // Scrape Kenya-bound vehicles
    const pages = 3;
    for (let page = 1; page <= pages; page++) {
      try {
        const pageItems = await this.withRetry(() => this.scrapePage(page));
        items.push(...pageItems);
      } catch (err) {
        console.error(`[BeforwardScraper] Failed page ${page}:`, err);
      }
    }

    return items;
  }

  private async scrapePage(page: number): Promise<RawScrapedItem[]> {
    const url = `${this.baseUrl}/used-car/search-results?DestinationPort=Mombasa&page=${page}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': this.getUA(),
        Accept: 'text/html',
      },
    });

    if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);

    const html = await res.text();
    return this.parseVehicles(html);
  }

  private parseVehicles(html: string): RawScrapedItem[] {
    const items: RawScrapedItem[] = [];

    const cardPattern = /<div[^>]*class="[^"]*car-result[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/gi;
    const stockPattern = /stock[_-]?no[:\s]+([A-Z0-9-]+)/i;
    const vinPattern = /\b([A-HJ-NPR-Z0-9]{17})\b/i;
    const gradePattern = /(?:Auction\s+)?Grade[:\s]+([0-9.]+[A-Z]?)/i;
    const mileagePattern = /(\d[\d,]+)\s*km/i;
    const makePattern = /class="[^"]*make[^"]*"[^>]*>([^<]+)</i;
    const modelPattern = /class="[^"]*model[^"]*"[^>]*>([^<]+)</i;
    const yearPattern = /class="[^"]*year[^"]*"[^>]*>(\d{4})</i;
    const pricePattern = /USD\s*([\d,]+)/i;
    const damagePattern = /(?:Damage|Condition)[:\s]+([^<\n]+)/i;
    const colorPattern = /Color[:\s]+([A-Za-z\s]+?)(?:<|\n|,)/i;
    const transmissionPattern = /(?:Transmission|Trans)[:\s]+(AT|MT|Automatic|Manual)/i;
    const enginePattern = /(\d{3,4})cc/i;
    const imagePattern = /<img[^>]*class="[^"]*car-img[^"]*"[^>]*src="([^"]+)"/i;

    // Also check for damage map data (location codes)
    const damageLocationPattern = /data-damage-location="([^"]+)"/gi;

    for (const match of html.matchAll(cardPattern)) {
      const body = match[1];
      const stock_no = body.match(stockPattern)?.[1] ?? null;
      const vin_raw = body.match(vinPattern)?.[1] ?? null;
      const japan_auction_grade = body.match(gradePattern)?.[1] ?? null;
      const mileage_text = body.match(mileagePattern)?.[1] ?? null;
      const make = body.match(makePattern)?.[1]?.trim() ?? null;
      const model = body.match(modelPattern)?.[1]?.trim() ?? null;
      const year_str = body.match(yearPattern)?.[1] ?? null;
      const year = year_str ? parseInt(year_str, 10) : null;
      const price_usd = body.match(pricePattern)?.[1] ?? null;
      const damage_description = body.match(damagePattern)?.[1]?.trim() ?? null;
      const color = body.match(colorPattern)?.[1]?.trim() ?? null;
      const transmission = body.match(transmissionPattern)?.[1] ?? null;
      const engine_cc = body.match(enginePattern)?.[1]
        ? parseInt(body.match(enginePattern)![1], 10)
        : null;
      const primary_image = body.match(imagePattern)?.[1] ?? null;

      // Collect damage location codes
      const damage_locations: string[] = [];
      for (const dlMatch of body.matchAll(damageLocationPattern)) {
        damage_locations.push(dlMatch[1]);
      }

      if (!stock_no && !vin_raw) continue;

      // Parse mileage as integer
      const mileage_km = mileage_text
        ? parseInt(mileage_text.replace(/,/g, ''), 10)
        : null;

      items.push({
        source: 'BEFORWARD',
        vin: vin_raw,
        plate: null,
        raw_data: {
          stock_no,
          vin: vin_raw,
          make,
          model,
          year,
          japan_auction_grade,           // Winner — overwrites all other grade sources
          mileage_km_at_export: mileage_km, // Pre-export mileage from Japan
          price_usd,
          damage_description,
          damage_locations,              // Location codes for 3D diagram
          color,
          transmission,
          engine_cc,
          primary_image,
          destination_port: 'Mombasa',
          scraped_at: new Date().toISOString(),
          confidence: 0.85,
          event_type: 'AUCTIONED',
        },
      });
    }

    return items;
  }
}
