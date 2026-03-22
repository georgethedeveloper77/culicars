// apps/api/src/services/scrapers/carDukaScraper.ts
import { BaseScraper, RawScrapedItem } from './baseScraper';

/**
 * Car Duka scraper — NCBA Bank auctions.
 * URL: carduka.com
 * Confidence: 0.75.
 */
export class CarDukaScraper extends BaseScraper {
  private baseUrl = 'https://carduka.com';

  constructor() {
    super('CAR_DUKA');
  }

  async scrape(): Promise<RawScrapedItem[]> {
    const items: RawScrapedItem[] = [];

    try {
      const auctionItems = await this.withRetry(() => this.scrapeAuctions());
      items.push(...auctionItems);
    } catch (err) {
      console.error('[CarDukaScraper] Failed:', err);
    }

    return items;
  }

  private async scrapeAuctions(): Promise<RawScrapedItem[]> {
    const url = `${this.baseUrl}/auctions`;
    const res = await fetch(url, {
      headers: { 'User-Agent': this.getUA() },
    });

    if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);

    const html = await res.text();
    return this.parseAuctions(html);
  }

  private parseAuctions(html: string): RawScrapedItem[] {
    const items: RawScrapedItem[] = [];

    const cardPattern = /<div[^>]*class="[^"]*car-listing[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/gi;
    const titlePattern = /<h[234][^>]*>([^<]+)<\/h[234]>/i;
    const platePattern = /\b([A-Z]{2,3}\s?\d{3,4}[A-Z]?)\b/i;
    const vinPattern = /\b([A-HJ-NPR-Z0-9]{17})\b/i;
    const yearPattern = /\b(19[89]\d|20[012]\d)\b/;
    const pricePattern = /KSh\s*([\d,]+)/i;
    const lotPattern = /Lot[:\s#]+([A-Z0-9-/]+)/i;
    const auctionDatePattern = /(\d{4}-\d{2}-\d{2}|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/;
    const conditionPattern = /Condition[:\s]+([^<\n]+)/i;
    const idPattern = /data-id="([^"]+)"/i;

    for (const match of html.matchAll(cardPattern)) {
      const body = match[1];
      const title = body.match(titlePattern)?.[1]?.trim() ?? null;
      const plate_raw = body.match(platePattern)?.[1] ?? null;
      const vin_raw = body.match(vinPattern)?.[1] ?? null;
      const year = body.match(yearPattern)?.[1] ? parseInt(body.match(yearPattern)![1], 10) : null;
      const price_text = body.match(pricePattern)?.[1] ?? null;
      const lot_number = body.match(lotPattern)?.[1] ?? null;
      const auction_date = body.match(auctionDatePattern)?.[1] ?? null;
      const condition = body.match(conditionPattern)?.[1]?.trim() ?? null;
      const car_id = body.match(idPattern)?.[1] ?? null;

      if (!title && !plate_raw && !vin_raw) continue;

      items.push({
        source: 'CAR_DUKA',
        vin: vin_raw,
        plate: plate_raw,
        raw_data: {
          car_id,
          lot_number,
          title,
          vin: vin_raw,
          plate: plate_raw,
          year,
          price_text,
          auction_date,
          condition,
          bank: 'NCBA',
          scraped_at: new Date().toISOString(),
          confidence: 0.75,
          event_type: 'AUCTIONED',
        },
      });
    }

    return items;
  }
}
