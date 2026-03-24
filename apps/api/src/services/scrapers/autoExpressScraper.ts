// apps/api/src/services/scrapers/autoExpressScraper.ts
import { BaseScraper, RawScrapedItem } from './baseScraper';

/**
 * Auto Express Kenya scraper.
 * PRIMARY service record source — garage, date, mileage, work performed.
 * Confidence: 0.8 (professionally recorded garage data).
 * This is CuliCars' key differentiator — no competitor has this.
 */
export class AutoExpressScraper extends BaseScraper {
  private baseUrl = 'https://autoexpress.co.ke';

  constructor() {
    super('AUTO_EXPRESS');
  }

  async scrape(): Promise<RawScrapedItem[]> {
    const items: RawScrapedItem[] = [];

    // Auto Express has a public service history page per vehicle
    // We scrape their recent updates feed and individual records
    try {
      const feedItems = await this.withRetry(() => this.scrapeFeed());
      items.push(...feedItems);
    } catch (err) {
      console.error('[AutoExpressScraper] Feed scrape failed:', err);
    }

    return items;
  }

  private async scrapeFeed(): Promise<RawScrapedItem[]> {
    const url = `${this.baseUrl}/service-records`;
    const res = await fetch(url, {
      headers: { 'User-Agent': this.getUA() },
    });

    if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);

    const html = await res.text();
    return this.parseServiceRecords(html);
  }

  private parseServiceRecords(html: string): RawScrapedItem[] {
    const items: RawScrapedItem[] = [];

    // Auto Express service record cards
    const recordPattern = /<div[^>]*class="[^"]*service-record[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/gi;
    const platePattern = /\b([A-Z]{2,3}\s?\d{3,4}[A-Z]?)\b/i;
    const vinPattern = /\b([A-HJ-NPR-Z0-9]{17})\b/i;
    const datePattern = /(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}|\d{4}-\d{2}-\d{2})/i;
    const mileagePattern = /(\d[\d,]+)\s*(?:km|Km|KM)/i;
    const garagePattern = /class="[^"]*garage[^"]*"[^>]*>([^<]+)</i;
    const workPattern = /class="[^"]*work-done[^"]*"[^>]*>([\s\S]*?)<\/(?:p|div|span)>/i;
    const idPattern = /data-record-id="([^"]+)"/i;

    for (const match of html.matchAll(recordPattern)) {
      const body = match[1];
      const plate_raw = body.match(platePattern)?.[1] ?? null;
      const vin_raw = body.match(vinPattern)?.[1] ?? null;
      const service_date = body.match(datePattern)?.[1] ?? null;
      const mileage_text = body.match(mileagePattern)?.[1] ?? null;
      const garage_name = body.match(garagePattern)?.[1]?.trim() ?? null;
      const work_done = body.match(workPattern)?.[1]?.replace(/<[^>]+>/g, ' ').trim() ?? null;
      const record_id = body.match(idPattern)?.[1] ?? null;

      items.push({
        source: 'AUTO_EXPRESS',
        vin: vin_raw,
        plate: plate_raw,
        rawData: {
          record_id,
          plate: plate_raw,
          vin: vin_raw,
          service_date,
          mileage_text,
          garage_name,
          work_done,
          scraped_at: new Date().toISOString(),
          confidence: 0.8,
          event_type: 'SERVICED',
        },
      });
    }

    return items;
  }

  async scrapeByPlate(plate: string): Promise<RawScrapedItem[]> {
    const url = `${this.baseUrl}/vehicle/${encodeURIComponent(plate)}/service-history`;
    try {
      const res = await this.withRetry(async () => {
        const r = await fetch(url, { headers: { 'User-Agent': this.getUA() } });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r;
      });
      const html = await res.text();
      return this.parseServiceRecords(html);
    } catch {
      return [];
    }
  }
}
