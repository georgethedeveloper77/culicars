// apps/api/src/services/scrapers/kraIbidScraper.ts
import { BaseScraper, RawScrapedItem } from './baseScraper';

/**
 * KRA iBid scraper — Kenya Revenue Authority Port auctions.
 * Source: ibid.kra.go.ke — publicly accessible.
 * Confidence: 0.75.
 */
export class KraIbidScraper extends BaseScraper {
  private baseUrl = 'https://ibid.kra.go.ke';

  constructor() {
    super('KRA_IBID');
  }

  async scrape(): Promise<RawScrapedItem[]> {
    const items: RawScrapedItem[] = [];

    try {
      const auctionItems = await this.withRetry(() => this.scrapeAuctions());
      items.push(...auctionItems);
    } catch (err) {
      console.error('[KraIbidScraper] Failed:', err);
    }

    return items;
  }

  private async scrapeAuctions(): Promise<RawScrapedItem[]> {
    const url = `${this.baseUrl}/auctions/vehicles`;
    const res = await fetch(url, {
      headers: { 'User-Agent': this.getUA() },
    });

    if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);

    const html = await res.text();
    return this.parseAuctions(html);
  }

  private parseAuctions(html: string): RawScrapedItem[] {
    const items: RawScrapedItem[] = [];

    const rowPattern = /<tr[^>]*class="[^"]*auction-item[^"]*"[^>]*>([\s\S]*?)<\/tr>/gi;
    const vinPattern = /\b([A-HJ-NPR-Z0-9]{17})\b/i;
    const chassisPattern = /Chassis[:\s]+([A-Z0-9-]{6,20})/i;
    const makePattern = /Make[:\s]+([A-Za-z]+)/i;
    const modelPattern = /Model[:\s]+([A-Za-z0-9 ]+?)(?:<|,|\n)/i;
    const yearPattern = /\b(19[89]\d|20[012]\d)\b/;
    const lotPattern = /Lot[:\s#]+([A-Z0-9/-]+)/i;
    const portPattern = /\b(Mombasa|Nairobi|Kisumu)\b/i;
    const auctionDatePattern = /(\d{4}-\d{2}-\d{2}|\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i;
    const reservePattern = /Reserve[:\s]+KSh\s*([\d,]+)/i;

    for (const match of html.matchAll(rowPattern)) {
      const body = match[1];
      const vin_raw = body.match(vinPattern)?.[1] ?? null;
      const chassis = body.match(chassisPattern)?.[1] ?? null;
      const make = body.match(makePattern)?.[1] ?? null;
      const model = body.match(modelPattern)?.[1]?.trim() ?? null;
      const year = body.match(yearPattern)?.[1] ? parseInt(body.match(yearPattern)![1], 10) : null;
      const lot_number = body.match(lotPattern)?.[1] ?? null;
      const port = body.match(portPattern)?.[1] ?? 'Mombasa';
      const auction_date = body.match(auctionDatePattern)?.[1] ?? null;
      const reserve_price = body.match(reservePattern)?.[1] ?? null;

      if (!vin_raw && !chassis && !lot_number) continue;

      items.push({
        source: 'KRA_IBID',
        vin: vin_raw,
        plate: null,
        rawData: {
          lot_number,
          vin: vin_raw,
          chassis_number: chassis,
          make,
          model,
          year,
          port,
          auction_date,
          reserve_price_text: reserve_price,
          scraped_at: new Date().toISOString(),
          confidence: 0.75,
          event_type: 'AUCTIONED',
        },
      });
    }

    return items;
  }
}
