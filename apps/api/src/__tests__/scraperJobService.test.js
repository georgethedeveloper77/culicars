"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// apps/api/src/__tests__/scraperJobService.test.ts
const vitest_1 = require("vitest");
const scraperJobService_1 = require("../services/scraperJobService");
// Mock prisma
vitest_1.vi.mock('../lib/prisma', () => ({
    __esModule: true,
    default: {
        scraper_jobs: {
            create: vitest_1.vi.fn(),
            update: vitest_1.vi.fn(),
            findUnique: vitest_1.vi.fn(),
            findMany: vitest_1.vi.fn(),
        },
    },
}));
const prisma_1 = __importDefault(require("../lib/prisma"));
const mockPrisma = prisma_1.default;
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
(0, vitest_1.describe)('scraperJobService', () => {
    (0, vitest_1.beforeEach)(() => vitest_1.vi.clearAllMocks());
    (0, vitest_1.describe)('createJob', () => {
        (0, vitest_1.it)('creates a job with queued status', async () => {
            mockPrisma.scraper_jobs.create.mockResolvedValue(mockJob);
            const job = await (0, scraperJobService_1.createJob)('JIJI', 'scheduled');
            (0, vitest_1.expect)(mockPrisma.scraper_jobs.create).toHaveBeenCalledWith({
                data: { source: 'JIJI', trigger: 'scheduled', status: 'queued' },
            });
            (0, vitest_1.expect)(job.status).toBe('queued');
            (0, vitest_1.expect)(job.source).toBe('JIJI');
        });
        (0, vitest_1.it)('defaults trigger to scheduled', async () => {
            mockPrisma.scraper_jobs.create.mockResolvedValue(mockJob);
            await (0, scraperJobService_1.createJob)('PIGIAME');
            (0, vitest_1.expect)(mockPrisma.scraper_jobs.create).toHaveBeenCalledWith(vitest_1.expect.objectContaining({ data: vitest_1.expect.objectContaining({ trigger: 'scheduled' }) }));
        });
        (0, vitest_1.it)('accepts manual trigger', async () => {
            mockPrisma.scraper_jobs.create.mockResolvedValue({ ...mockJob, trigger: 'manual' });
            const job = await (0, scraperJobService_1.createJob)('JIJI', 'manual');
            (0, vitest_1.expect)(mockPrisma.scraper_jobs.create).toHaveBeenCalledWith(vitest_1.expect.objectContaining({ data: vitest_1.expect.objectContaining({ trigger: 'manual' }) }));
        });
    });
    (0, vitest_1.describe)('updateJob', () => {
        (0, vitest_1.it)('updates job fields', async () => {
            const updated = { ...mockJob, status: 'running', started_at: new Date() };
            mockPrisma.scraper_jobs.update.mockResolvedValue(updated);
            const result = await (0, scraperJobService_1.updateJob)('job-uuid-1', { status: 'running', started_at: new Date() });
            (0, vitest_1.expect)(mockPrisma.scraper_jobs.update).toHaveBeenCalledWith(vitest_1.expect.objectContaining({ where: { id: 'job-uuid-1' } }));
            (0, vitest_1.expect)(result.status).toBe('running');
        });
    });
    (0, vitest_1.describe)('completeJob', () => {
        (0, vitest_1.it)('marks job as completed with counts', async () => {
            const completed = { ...mockJob, status: 'completed', items_found: 50, items_stored: 45, items_skipped: 5 };
            mockPrisma.scraper_jobs.update.mockResolvedValue(completed);
            const result = await (0, scraperJobService_1.completeJob)('job-uuid-1', {
                items_found: 50,
                items_stored: 45,
                items_skipped: 5,
            });
            (0, vitest_1.expect)(mockPrisma.scraper_jobs.update).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                where: { id: 'job-uuid-1' },
                data: vitest_1.expect.objectContaining({
                    status: 'completed',
                    items_found: 50,
                    items_stored: 45,
                    items_skipped: 5,
                }),
            }));
            (0, vitest_1.expect)(result.status).toBe('completed');
        });
    });
    (0, vitest_1.describe)('failJob', () => {
        (0, vitest_1.it)('marks job as failed with error message', async () => {
            const failed = { ...mockJob, status: 'failed', error_log: 'Network timeout' };
            mockPrisma.scraper_jobs.update.mockResolvedValue(failed);
            const result = await (0, scraperJobService_1.failJob)('job-uuid-1', 'Network timeout');
            (0, vitest_1.expect)(mockPrisma.scraper_jobs.update).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                data: vitest_1.expect.objectContaining({
                    status: 'failed',
                    error_log: 'Network timeout',
                }),
            }));
            (0, vitest_1.expect)(result.status).toBe('failed');
            (0, vitest_1.expect)(result.error_log).toBe('Network timeout');
        });
    });
    (0, vitest_1.describe)('getJob', () => {
        (0, vitest_1.it)('returns job by id', async () => {
            mockPrisma.scraper_jobs.findUnique.mockResolvedValue(mockJob);
            const job = await (0, scraperJobService_1.getJob)('job-uuid-1');
            (0, vitest_1.expect)(job).not.toBeNull();
            (0, vitest_1.expect)(job.id).toBe('job-uuid-1');
        });
        (0, vitest_1.it)('returns null when not found', async () => {
            mockPrisma.scraper_jobs.findUnique.mockResolvedValue(null);
            const job = await (0, scraperJobService_1.getJob)('nonexistent');
            (0, vitest_1.expect)(job).toBeNull();
        });
    });
    (0, vitest_1.describe)('listJobs', () => {
        (0, vitest_1.it)('returns list of jobs ordered by created_at desc', async () => {
            const jobs = [mockJob, { ...mockJob, id: 'job-uuid-2' }];
            mockPrisma.scraper_jobs.findMany.mockResolvedValue(jobs);
            const result = await (0, scraperJobService_1.listJobs)(50);
            (0, vitest_1.expect)(result).toHaveLength(2);
            (0, vitest_1.expect)(mockPrisma.scraper_jobs.findMany).toHaveBeenCalledWith(vitest_1.expect.objectContaining({ orderBy: { created_at: 'desc' }, take: 50 }));
        });
    });
});
