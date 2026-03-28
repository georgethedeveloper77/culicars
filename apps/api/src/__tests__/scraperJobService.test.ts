// apps/api/src/__tests__/scraperJobService.test.ts
import { vi, describe, it, expect, beforeEach, type Mocked, type MockInstance } from 'vitest';
import {
  createJob,
  updateJob,
  completeJob,
  failJob,
  getJob,
  listJobs,
} from '../services/scraperJobService';

// Mock prisma
vi.mock('../lib/prisma', () => ({
  __esModule: true,
  default: {
    scraperJob: {
      create: vi.fn(),
      update: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

import prisma from '../lib/prisma';
const mockPrisma = prisma as Mocked<typeof prisma>;

const mockJob = {
  id: 'job-uuid-1',
  source: 'JIJI',
  status: 'queued',
  trigger: 'scheduled',
  items_found: 0,
  items_stored: 0,
  items_skipped: 0,
  started_at: null,
  completed_at: null,
  error_log: null,
  created_at: new Date('2024-01-01'),
};

describe('scraperJobService', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('createJob', () => {
    it('creates a job with queued status', async () => {
      (mockPrisma.scraperJob.create as MockInstance).mockResolvedValue(mockJob);

      const job = await createJob('JIJI', 'scheduled');

      expect(mockPrisma.scraperJob.create).toHaveBeenCalledWith({
        data: { source: 'JIJI', trigger: 'scheduled', status: 'queued' },
      });
      expect(job.status).toBe('queued');
      expect(job.source).toBe('JIJI');
    });

    it('defaults trigger to scheduled', async () => {
      (mockPrisma.scraperJob.create as MockInstance).mockResolvedValue(mockJob);
      await createJob('PIGIAME');
      expect(mockPrisma.scraperJob.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ trigger: 'scheduled' }) })
      );
    });

    it('accepts manual trigger', async () => {
      (mockPrisma.scraperJob.create as MockInstance).mockResolvedValue({ ...mockJob, trigger: 'manual' });
      const job = await createJob('JIJI', 'manual');
      expect(mockPrisma.scraperJob.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ trigger: 'manual' }) })
      );
    });
  });

  describe('updateJob', () => {
    it('updates job fields', async () => {
      const updated = { ...mockJob, status: 'running', started_at: new Date() };
      (mockPrisma.scraperJob.update as MockInstance).mockResolvedValue(updated);

      const result = await updateJob('job-uuid-1', { status: 'running', started_at: new Date() });

      expect(mockPrisma.scraperJob.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'job-uuid-1' } })
      );
      expect(result.status).toBe('running');
    });
  });

  describe('completeJob', () => {
    it('marks job as completed with counts', async () => {
      const completed = { ...mockJob, status: 'completed', items_found: 50, items_stored: 45, items_skipped: 5 };
      (mockPrisma.scraperJob.update as MockInstance).mockResolvedValue(completed);

      const result = await completeJob('job-uuid-1', {
        items_found: 50,
        items_stored: 45,
        items_skipped: 5,
      });

      expect(mockPrisma.scraperJob.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'job-uuid-1' },
          data: expect.objectContaining({
            status: 'completed',
            items_found: 50,
            items_stored: 45,
            items_skipped: 5,
          }),
        })
      );
      expect(result.status).toBe('completed');
    });
  });

  describe('failJob', () => {
    it('marks job as failed with error message', async () => {
      const failed = { ...mockJob, status: 'failed', error_log: 'Network timeout' };
      (mockPrisma.scraperJob.update as MockInstance).mockResolvedValue(failed);

      const result = await failJob('job-uuid-1', 'Network timeout');

      expect(mockPrisma.scraperJob.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'failed',
            error_log: 'Network timeout',
          }),
        })
      );
      expect(result.status).toBe('failed');
      expect(result.error_log).toBe('Network timeout');
    });
  });

  describe('getJob', () => {
    it('returns job by id', async () => {
      (mockPrisma.scraperJob.findUnique as MockInstance).mockResolvedValue(mockJob);
      const job = await getJob('job-uuid-1');
      expect(job).not.toBeNull();
      expect(job!.id).toBe('job-uuid-1');
    });

    it('returns null when not found', async () => {
      (mockPrisma.scraperJob.findUnique as MockInstance).mockResolvedValue(null);
      const job = await getJob('nonexistent');
      expect(job).toBeNull();
    });
  });

  describe('listJobs', () => {
    it('returns list of jobs ordered by created_at desc', async () => {
      const jobs = [mockJob, { ...mockJob, id: 'job-uuid-2' }];
      (mockPrisma.scraperJob.findMany as MockInstance).mockResolvedValue(jobs);

      const result = await listJobs(50);
      expect(result).toHaveLength(2);
      expect(mockPrisma.scraperJob.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { created_at: 'desc' }, take: 50 })
      );
    });
  });
});
