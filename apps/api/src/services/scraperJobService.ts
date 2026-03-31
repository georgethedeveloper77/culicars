// apps/api/src/services/scraperJobService.ts
import { prisma } from '../lib/prisma';

export type ScraperSource =
  | 'JIJI'
  | 'PIGIAME'
  | 'OLX'
  | 'AUTOCHEK'
  | 'AUTOSKENYA'
  | 'KABA'
  | 'AUTO_EXPRESS'
  | 'KRA_IBID'
  | 'GARAM'
  | 'MOGO'
  | 'CAR_DUKA'
  | 'BEFORWARD'
  | 'STC_JAPAN'
  | 'MANUAL_IMPORT';

export type JobTrigger = 'scheduled' | 'manual';
export type JobStatus = 'queued' | 'running' | 'completed' | 'failed';

export interface ScraperJob {
  id: string;
  source: ScraperSource;
  status: JobStatus;
  trigger: JobTrigger;
  items_found: number;
  items_stored: number;
  items_skipped: number;
  started_at: Date | null;
  completed_at: Date | null;
  error_log: string | null;
  created_at: Date;
}

export async function createJob(
  source: ScraperSource,
  trigger: JobTrigger = 'scheduled'
): Promise<ScraperJob> {
  return prisma.scraper_jobs.create({
    data: { source, trigger, status: 'queued' },
  }) as unknown as Promise<ScraperJob>;
}

export async function updateJob(
  id: string,
  data: Partial<Pick<ScraperJob, 'status' | 'items_found' | 'items_stored' | 'items_skipped' | 'started_at'>>
): Promise<ScraperJob> {
  return prisma.scraper_jobs.update({ where: { id }, data }) as unknown as Promise<ScraperJob>;
}

export async function completeJob(
  id: string,
  counts: { items_found: number; items_stored: number; items_skipped: number }
): Promise<ScraperJob> {
  return prisma.scraper_jobs.update({
    where: { id },
    data: {
      status: 'completed',
      completed_at: new Date(),
      ...counts,
    },
  }) as unknown as Promise<ScraperJob>;
}

export async function failJob(id: string, errorMessage: string): Promise<ScraperJob> {
  return prisma.scraper_jobs.update({
    where: { id },
    data: {
      status: 'failed',
      completed_at: new Date(),
      error_log: errorMessage,
    },
  }) as unknown as Promise<ScraperJob>;
}

export async function getJob(id: string): Promise<ScraperJob | null> {
  return prisma.scraper_jobs.findUnique({ where: { id } }) as Promise<ScraperJob | null>;
}

export async function listJobs(limit = 50): Promise<ScraperJob[]> {
  return prisma.scraper_jobs.findMany({
    orderBy: { created_at: 'desc' },
    take: limit,
  }) as unknown as Promise<ScraperJob[]>;
}
