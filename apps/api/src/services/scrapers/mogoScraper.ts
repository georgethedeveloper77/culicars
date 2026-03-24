// apps/api/src/services/scrapers/mogoScraper.ts
import { BaseScraper, RawScrapedItem } from './baseScraper';

/**
 * MOGO Auction scraper — damaged vehicles + photos.
 * URL: cars.mogo.co.ke
 * Confidence: 0.75. Key for damage records.
 */
export class MogoScraper extends BaseScraper {
  private baseUrl = 'https://cars.mogo.co.ke';

  constructor() {
    super('MOGO');
  }

  async scrape(): Promise<RawScrapedItem[]> {
    const items: RawScrapedItem[] = [];

    try {
      const auctionItems = await this.withRetry(() => this.scrapeAuctions());
      items.push(...auctionItems);
    } catch (err) {
      console.error('[MogoScraper] Failed:', err);
    }

    return items;
  }

  private async scrapeAuctions(): Promise<RawScrapedItem[]> {
    const url = `${this.baseUrl}/auction`;
    const res = await fetch(url, {
      headers: { 'User-Agent': this.getUA() },
    });

    if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);

    const html = await res.text();
    return this.parseAuctions(html);
  }

  private parseAuctions(html: string): RawScrapedItem[] {
    const items: RawScrapedItem[] = [];

    const cardPattern = /<div[^>]*class="[^"]*vehicle-card[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/gi;
    const titlePattern = /<h[23][^>]*>([^<]+)<\/h[23]>/i;
    const platePattern = /\b([A-Z]{2,3}\s?\d{3,4}[A-Z]?)\b/i;
    const vinPattern = /\b([A-HJ-NPR-Z0-9]{17})\b/i;
    const yearPattern = /\b(19[89]\d|20[012]\d)\b/;
    const damagePattern = /(?:Damage|Condition)[:\s]+([^<\n,]+)/i;
    const imagePattern = /<img[^>]*src="([^"]+)"[^>]*>/gi;
    const pricePattern = /KSh\s*([\d,]+)/i;
    const idPattern = /data-vehicle-id="([^"]+)"/i;
    const auctionDatePattern = /(\d{4}-\d{2}-\d{2})/;

    for (const match of html.matchAll(cardPattern)) {
      const body = match[1];
      const title = body.match(titlePattern)?.[1]?.trim() ?? null;
      const plate_raw = body.match(platePattern)?.[1] ?? null;
      const vin_raw = body.match(vinPattern)?.[1] ?? null;
      const year = body.match(yearPattern)?.[1] ? parseInt(body.match(yearPattern)![1], 10) : null;
      const damage_description = body.match(damagePattern)?.[1]?.trim() ?? null;
      const price_text = body.match(pricePattern)?.[1] ?? null;
      const vehicle_id = body.match(idPattern)?.[1] ?? null;
      const auction_date = body.match(auctionDatePattern)?.[1] ?? null;

      // Extract all image URLs
      const image_urls: string[] = [];
      for (const imgMatch of body.matchAll(imagePattern)) {
        const src = imgMatch[1];
        if (src && !src.includes('placeholder') && !src.includes('logo')) {
          image_urls.push(src);
        }
      }

      if (!title && !plate_raw && !vin_raw) continue;

      items.push({
        source: 'MOGO',
        vin: vin_raw,
        plate: plate_raw,
        rawData: {
          vehicle_id,
          title,
          vin: vin_raw,
          plate: plate_raw,
          year,
          damage_description,
          image_urls,
          price_text,
          auction_date,
          scraped_at: new Date().toISOString(),
          confidence: 0.75,
          event_type: 'AUCTIONED',
          has_damage: true,
        },
      });
    }

    return items;
  }
}
