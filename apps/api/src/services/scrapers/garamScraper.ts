// apps/api/src/services/scrapers/garamScraper.ts
import { BaseScraper, RawScrapedItem } from './baseScraper';

/**
 * Garam Investments scraper — bank repossession auctions.
 * Sources: KCB, Equity, Co-op Bank repos.
 * Confidence: 0.75.
 */
export class GaramScraper extends BaseScraper {
  private baseUrl = 'https://garam.co.ke';

  constructor() {
    super('GARAM');
  }

  async scrape(): Promise<RawScrapedItem[]> {
    const items: RawScrapedItem[] = [];

    try {
      const auctionItems = await this.withRetry(() => this.scrapeRepos());
      items.push(...auctionItems);
    } catch (err) {
      console.error('[GaramScraper] Failed:', err);
    }

    return items;
  }

  private async scrapeRepos(): Promise<RawScrapedItem[]> {
    const url = `${this.baseUrl}/current-auctions/motor-vehicles`;
    const res = await fetch(url, {
      headers: { 'User-Agent': this.getUA() },
    });

    if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);

    const html = await res.text();
    return this.parseRepos(html);
  }

  private parseRepos(html: string): RawScrapedItem[] {
    const items: RawScrapedItem[] = [];

    const cardPattern = /<div[^>]*class="[^"]*auction-item[^"]*"[^>]*>([\s\S]*?)<\/div>\s*(?=<div[^>]*class="[^"]*auction-item|<\/section>)/gi;
    const titlePattern = /<h[23][^>]*>([^<]+)<\/h[23]>/i;
    const platePattern = /\b([A-Z]{2,3}\s?\d{3,4}[A-Z]?)\b/i;
    const vinPattern = /\b([A-HJ-NPR-Z0-9]{17})\b/i;
    const yearPattern = /\b(19[89]\d|20[012]\d)\b/;
    const bankPattern = /(?:Bank|Financier)[:\s]+([A-Za-z\s&]+?)(?:<|\n|,)/i;
    const lotPattern = /Lot[:\s#]+([A-Z0-9/-]+)/i;
    const auctionDatePattern = /(\d{4}-\d{2}-\d{2}|\d{1,2}[-\/]\d{1,2}[-\/]\d{4})/;
    const mileagePattern = /(\d[\d,]+)\s*km/i;
    const idPattern = /data-id="([^"]+)"/i;

    for (const match of html.matchAll(cardPattern)) {
      const body = match[1];
      const title = body.match(titlePattern)?.[1]?.trim() ?? null;
      const plate_raw = body.match(platePattern)?.[1] ?? null;
      const vin_raw = body.match(vinPattern)?.[1] ?? null;
      const year = body.match(yearPattern)?.[1] ? parseInt(body.match(yearPattern)![1], 10) : null;
      const bank_name = body.match(bankPattern)?.[1]?.trim() ?? null;
      const lot_number = body.match(lotPattern)?.[1] ?? null;
      const auction_date = body.match(auctionDatePattern)?.[1] ?? null;
      const mileage_text = body.match(mileagePattern)?.[1] ?? null;
      const repo_id = body.match(idPattern)?.[1] ?? null;

      if (!title && !plate_raw && !vin_raw) continue;

      items.push({
        source: 'GARAM',
        vin: vin_raw,
        plate: plate_raw,
        raw_data: {
          repo_id,
          lot_number,
          title,
          vin: vin_raw,
          plate: plate_raw,
          year,
          bank_name,
          auction_date,
          mileage_text,
          scraped_at: new Date().toISOString(),
          confidence: 0.75,
          event_type: 'AUCTIONED',
        },
      });
    }

    return items;
  }
}
