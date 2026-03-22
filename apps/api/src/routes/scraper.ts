// apps/api/src/routes/scraper.ts
import { Router, Request, Response, NextFunction } from 'express';
import { requireRole } from '../middleware/requireRole';
import { runScraper, getRegisteredSources } from '../services/scraperOrchestrator';
import { getJob, listJobs, ScraperSource } from '../services/scraperJobService';

const router = Router();

// All scraper routes require admin
router.use(requireRole('admin'));

/**
 * POST /admin/scraper/run
 * Manually trigger a scraper run.
 * Body: { source: ScraperSource }
 */
router.post('/run', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { source } = req.body as { source?: string };

    if (!source) {
      res.status(400).json({ error: 'source is required', available: getRegisteredSources() });
      return;
    }

    const validSources = getRegisteredSources();
    if (!validSources.includes(source as ScraperSource)) {
      res.status(400).json({
        error: `Unknown source: ${source}`,
        available: validSources,
      });
      return;
    }

    // Fire and respond — don't await the full run (it can take minutes)
    // Return the job ID immediately so admin can poll for status
    const resultPromise = runScraper(source as ScraperSource, 'manual');

    // We need the jobId quickly — extract it from the promise
    resultPromise.catch((err) => {
      console.error(`[scraperRouter] Background run failed for ${source}:`, err);
    });

    // For admin convenience, we wait briefly to get the jobId then return
    const timeoutResult = await Promise.race([
      resultPromise,
      new Promise<{ jobId: string; queued: true }>((resolve) =>
        setTimeout(() => resolve({ jobId: 'pending', queued: true }), 500)
      ),
    ]);

    res.status(202).json({
      message: `Scraper ${source} started`,
      ...timeoutResult,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /admin/scraper/jobs
 * List recent scraper jobs.
 */
router.get('/jobs', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const jobs = await listJobs(100);
    res.json({ jobs, total: jobs.length });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /admin/scraper/jobs/:id
 * Get a specific scraper job by ID.
 */
router.get('/jobs/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const job = await getJob(req.params.id);
    if (!job) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }
    res.json({ job });
  } catch (err) {
    next(err);
  }
});

export default router;
