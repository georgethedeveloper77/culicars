// apps/api/src/services/scrapers/pigiaMeScraper.ts
import { BaseScraper, RawScrapedItem } from './baseScraper';

export class PigiaMeScraper extends BaseScraper {
  private baseUrl = 'https://pigiame.co.ke/cars-for-sale';

  constructor() {
    super('PIGIAME');
  }

  async scrape(): Promise<RawScrapedItem[]> {
    const items: RawScrapedItem[] = [];
    const pages = 5;

    for (let page = 1; page <= pages; page++) {
      try {
        const pageItems = await this.withRetry(() => this.scrapePage(page));
        items.push(...pageItems);
      } catch (err) {
        console.error(`[PigiaMeScraper] Failed page ${page}:`, err);
      }
    }

    return items;
  }

  private async scrapePage(page: number): Promise<RawScrapedItem[]> {
    const url = `${this.baseUrl}?page=${page}`;
    const res = await fetch(url, {
      headers: { 'User-Agent': this.getUA() },
    });

    if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);

    const html = await res.text();
    return this.parseListings(html);
  }

  private parseListings(html: string): RawScrapedItem[] {
    const items: RawScrapedItem[] = [];

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
      const year = body.match(yearPattern)?.[1] ? parseInt(body.match(yearPattern)![1], 10) : null;
      const location = body.match(locationPattern)?.[1]?.trim() ?? null;

      items.push({
        source: 'PIGIAME',
        vin: null,
        plate: null,
        raw_data: {
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
