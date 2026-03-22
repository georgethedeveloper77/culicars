// apps/api/src/jobs/scheduledScrape.ts
import cron from 'node-cron';
import { runScraper, ScraperSource } from '../services/scraperOrchestrator';

type ScheduleGroup = {
  label: string;
  cronExpr: string;
  sources: ScraperSource[];
};

const SCHEDULES: ScheduleGroup[] = [
  {
    label: 'hourly',
    cronExpr: '0 * * * *',           // Every hour at :00
    sources: ['JIJI', 'PIGIAME', 'OLX', 'AUTOCHEK'],
  },
  {
    label: 'every-6h',
    cronExpr: '0 */6 * * *',         // Every 6 hours
    sources: ['AUTO_EXPRESS', 'KABA', 'AUTOSKENYA'],
  },
  {
    label: 'daily',
    cronExpr: '0 2 * * *',           // 02:00 EAT daily (UTC+3 → 23:00 UTC)
    sources: ['KRA_IBID', 'GARAM', 'MOGO', 'CAR_DUKA'],
  },
  {
    label: 'weekly',
    cronExpr: '0 3 * * 0',           // Sunday 03:00 EAT
    sources: ['BEFORWARD'],
  },
];

const MAX_CONCURRENCY = parseInt(process.env.SCRAPER_CONCURRENCY ?? '3', 10);

async function runGroup(sources: ScraperSource[], label: string): Promise<void> {
  console.log(`[scheduledScrape] Starting ${label} group: ${sources.join(', ')}`);

  // Run in chunks to respect SCRAPER_CONCURRENCY
  for (let i = 0; i < sources.length; i += MAX_CONCURRENCY) {
    const chunk = sources.slice(i, i + MAX_CONCURRENCY);
    await Promise.allSettled(
      chunk.map((source) =>
        runScraper(source, 'scheduled').then((result) => {
          if (result.error) {
            console.error(`[scheduledScrape] ${source} failed: ${result.error}`);
          } else {
            console.log(
              `[scheduledScrape] ${source} done — found:${result.items_found} stored:${result.items_stored} inserted:${result.processor_inserted}`
            );
          }
        })
      )
    );
  }

  console.log(`[scheduledScrape] ${label} group complete`);
}

let initialized = false;

export function initScheduledScrape(): void {
  if (initialized) return;
  initialized = true;

  for (const schedule of SCHEDULES) {
    const { label, cronExpr, sources } = schedule;

    cron.schedule(cronExpr, () => {
      runGroup(sources, label).catch((err) => {
        console.error(`[scheduledScrape] ${label} group error:`, err);
      });
    });

    console.log(`[scheduledScrape] Registered ${label} schedule (${cronExpr}) for: ${sources.join(', ')}`);
  }
}
