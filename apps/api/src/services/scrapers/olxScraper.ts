// apps/api/src/services/scrapers/olxScraper.ts
import { BaseScraper, RawScrapedItem } from './baseScraper';

export class OlxScraper extends BaseScraper {
  private baseUrl = 'https://www.olxkenya.co.ke/cars-for-sale';

  constructor() {
    super('OLX');
  }

  async scrape(): Promise<RawScrapedItem[]> {
    const items: RawScrapedItem[] = [];
    const pages = 5;

    for (let page = 1; page <= pages; page++) {
      try {
        const pageItems = await this.withRetry(() => this.scrapePage(page));
        items.push(...pageItems);
      } catch (err) {
        console.error(`[OlxScraper] Failed page ${page}:`, err);
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

    // OLX uses data-aut-id attributes
    const listingPattern = /data-aut-id="itemBox[^"]*"[^>]*>([\s\S]*?)(?=data-aut-id="itemBox|<\/ul>)/gi;
    const titlePattern = /data-aut-id="itemTitle"[^>]*>([^<]+)</i;
    const pricePattern = /data-aut-id="itemPrice"[^>]*>([\d,\s]+)/i;
    const idPattern = /href="\/item\/([^"?]+)/i;
    const yearPattern = /\b(19[89]\d|20[012]\d)\b/;
    const mileagePattern = /(\d[\d,]+)\s*km/i;

    for (const match of html.matchAll(listingPattern)) {
      const body = match[1];
      const listing_id = body.match(idPattern)?.[1] ?? null;
      const title = body.match(titlePattern)?.[1]?.trim() ?? null;
      const price_text = body.match(pricePattern)?.[1]?.trim() ?? null;
      const year = body.match(yearPattern)?.[1] ? parseInt(body.match(yearPattern)![1], 10) : null;
      const mileage_text = body.match(mileagePattern)?.[1] ?? null;

      if (!listing_id) continue;

      items.push({
        source: 'OLX',
        vin: null,
        plate: null,
        rawData: {
          listing_id,
          title,
          price_text,
          mileage_text,
          year,
          scraped_at: new Date().toISOString(),
          confidence: 0.5,
          event_type: 'LISTED_FOR_SALE',
        },
      });
    }

    return items;
  }
}
