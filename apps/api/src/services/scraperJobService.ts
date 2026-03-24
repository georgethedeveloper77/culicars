// apps/api/src/services/scraperJobService.ts
import prisma from '../lib/prisma';

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
  itemsFound: number;
  itemsStored: number;
  itemsSkipped: number;
  startedAt: Date | null;
  completedAt: Date | null;
  errorLog: string | null;
  createdAt: Date;
}

export async function createJob(
  source: ScraperSource,
  trigger: JobTrigger = 'scheduled'
): Promise<ScraperJob> {
  return prisma.scraperJob.create({
    data: { source, trigger, status: 'queued' },
  }) as Promise<ScraperJob>;
}

export async function updateJob(
  id: string,
  data: Partial<Pick<ScraperJob, 'status' | 'itemsFound' | 'itemsStored' | 'itemsSkipped' | 'startedAt'>>
): Promise<ScraperJob> {
  return prisma.scraperJob.update({ where: { id }, data }) as Promise<ScraperJob>;
}

export async function completeJob(
  id: string,
  counts: { itemsFound: number; itemsStored: number; itemsSkipped: number }
): Promise<ScraperJob> {
  return prisma.scraperJob.update({
    where: { id },
    data: {
      status: 'completed',
      completedAt: new Date(),
      ...counts,
    },
  }) as Promise<ScraperJob>;
}

export async function failJob(id: string, errorMessage: string): Promise<ScraperJob> {
  return prisma.scraperJob.update({
    where: { id },
    data: {
      status: 'failed',
      completedAt: new Date(),
      errorLog: errorMessage,
    },
  }) as Promise<ScraperJob>;
}

export async function getJob(id: string): Promise<ScraperJob | null> {
  return prisma.scraperJob.findUnique({ where: { id } }) as Promise<ScraperJob | null>;
}

export async function listJobs(limit = 50): Promise<ScraperJob[]> {
  return prisma.scraperJob.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
  }) as Promise<ScraperJob[]>;
}
