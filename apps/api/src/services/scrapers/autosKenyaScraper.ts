// apps/api/src/services/scrapers/autosKenyaScraper.ts
import { BaseScraper, RawScrapedItem } from './baseScraper';

export class AutosKenyaScraper extends BaseScraper {
  private baseUrl = 'https://autoskenya.com/used-cars';

  constructor() {
    super('AUTOSKENYA');
  }

  async scrape(): Promise<RawScrapedItem[]> {
    const items: RawScrapedItem[] = [];
    const pages = 3;

    for (let page = 1; page <= pages; page++) {
      try {
        const pageItems = await this.withRetry(() => this.scrapePage(page));
        items.push(...pageItems);
      } catch (err) {
        console.error(`[AutosKenyaScraper] Failed page ${page}:`, err);
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

    const cardPattern = /<div[^>]*class="[^"]*car-card[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/gi;
    const titlePattern = /<h[23][^>]*>([^<]+)<\/h[23]>/i;
    const pricePattern = /KSh[\s]*([\d,]+)/i;
    const mileagePattern = /(\d[\d,]+)\s*km/i;
    const idPattern = /href="[^"]*\/([^/"]+)"/i;
    const yearPattern = /\b(19[89]\d|20[012]\d)\b/;

    for (const match of html.matchAll(cardPattern)) {
      const body = match[1];
      const title = body.match(titlePattern)?.[1]?.trim() ?? null;
      const price_text = body.match(pricePattern)?.[1] ?? null;
      const mileage_text = body.match(mileagePattern)?.[1] ?? null;
      const listing_id = body.match(idPattern)?.[1] ?? null;
      const year = title?.match(yearPattern)?.[1]
        ? parseInt(title.match(yearPattern)![1], 10)
        : null;

      if (!title) continue;

      items.push({
        source: 'AUTOSKENYA',
        vin: null,
        plate: null,
        raw_data: {
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
