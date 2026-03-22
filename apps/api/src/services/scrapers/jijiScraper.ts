// apps/api/src/services/scrapers/jijiScraper.ts
import { BaseScraper, RawScrapedItem } from './baseScraper';

/**
 * Jiji.co.ke scraper — Kenya's highest-volume car listings.
 * Scrapes make, model, year, mileage, price, plate, VIN where available.
 * Confidence: 0.5 (self-reported listings).
 */
export class JijiScraper extends BaseScraper {
  private baseUrl = 'https://jiji.co.ke/cars';

  constructor() {
    super('JIJI');
  }

  async scrape(): Promise<RawScrapedItem[]> {
    const items: RawScrapedItem[] = [];
    const pages = 5; // Scrape first 5 pages per run

    for (let page = 1; page <= pages; page++) {
      try {
        const pageItems = await this.withRetry(() => this.scrapePage(page));
        items.push(...pageItems);
      } catch (err) {
        console.error(`[JijiScraper] Failed page ${page}:`, err);
      }
    }

    return items;
  }

  private async scrapePage(page: number): Promise<RawScrapedItem[]> {
    const url = `${this.baseUrl}?page=${page}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': this.getUA(),
        Accept: 'text/html,application/xhtml+xml',
      },
    });

    if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);

    const html = await res.text();
    return this.parseListings(html);
  }

  private parseListings(html: string): RawScrapedItem[] {
    const items: RawScrapedItem[] = [];

    // Extract JSON-LD structured data or parse article elements
    const scriptMatches = html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi);
    for (const match of scriptMatches) {
      try {
        const data = JSON.parse(match[1]);
        if (data['@type'] === 'ItemList') {
          for (const element of data.itemListElement ?? []) {
            const item = element.item ?? element;
            items.push({
              source: 'JIJI',
              vin: null,
              plate: null,
              raw_data: {
                listing_id: item['@id'] ?? item.identifier,
                title: item.name,
                price: item.offers?.price,
                currency: item.offers?.priceCurrency ?? 'KES',
                url: item.url,
                description: item.description,
                image_url: item.image,
                scraped_at: new Date().toISOString(),
                confidence: 0.5,
                event_type: 'LISTED_FOR_SALE',
              },
            });
          }
        }
      } catch {
        // Not valid JSON-LD, continue
      }
    }

    // Fallback: parse listing cards via regex for key fields
    const listingPattern = /data-listing-id="([^"]+)"[\s\S]*?class="[^"]*b-advert-title[^"]*"[^>]*>([^<]+)</gi;
    const pricePattern = /class="[^"]*qa-advert-price[^"]*"[^>]*>([\d,\s]+KSh)/gi;
    const mileagePattern = /(\d[\d,]+)\s*(?:km|kilometers)/gi;
    const yearPattern = /\b(19[89]\d|20[012]\d)\b/g;

    const listingMatches = [...html.matchAll(listingPattern)];
    const priceMatches = [...html.matchAll(pricePattern)];
    const mileageMatches = [...html.matchAll(mileagePattern)];

    for (let i = 0; i < listingMatches.length; i++) {
      const [, listing_id, title] = listingMatches[i];
      const price_text = priceMatches[i]?.[1] ?? null;
      const mileage_text = mileageMatches[i]?.[1] ?? null;
      const year_match = title.match(yearPattern)?.[0] ?? null;

      // Avoid duplicates with JSON-LD parsed items
      if (items.some((it) => it.raw_data.listing_id === listing_id)) continue;

      items.push({
        source: 'JIJI',
        vin: null,
        plate: null,
        raw_data: {
          listing_id,
          title: title.trim(),
          price_text,
          mileage_text,
          year: year_match ? parseInt(year_match, 10) : null,
          scraped_at: new Date().toISOString(),
          confidence: 0.5,
          event_type: 'LISTED_FOR_SALE',
        },
      });
    }

    return items;
  }
}
