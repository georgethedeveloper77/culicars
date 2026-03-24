"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// apps/api/src/routes/scraper.ts
const express_1 = require("express");
const requireRole_1 = require("../middleware/requireRole");
const scraperOrchestrator_1 = require("../services/scraperOrchestrator");
const scraperJobService_1 = require("../services/scraperJobService");
const router = (0, express_1.Router)();
// All scraper routes require admin
router.use((0, requireRole_1.requireRole)('admin'));
/**
 * POST /admin/scraper/run
 * Manually trigger a scraper run.
 * Body: { source: ScraperSource }
 */
router.post('/run', async (req, res, next) => {
    try {
        const { source } = req.body;
        if (!source) {
            res.status(400).json({ error: 'source is required', available: (0, scraperOrchestrator_1.getRegisteredSources)() });
            return;
        }
        const validSources = (0, scraperOrchestrator_1.getRegisteredSources)();
        if (!validSources.includes(source)) {
            res.status(400).json({
                error: `Unknown source: ${source}`,
                available: validSources,
            });
            return;
        }
        // Fire and respond — don't await the full run (it can take minutes)
        // Return the job ID immediately so admin can poll for status
        const resultPromise = (0, scraperOrchestrator_1.runScraper)(source, 'manual');
        // We need the jobId quickly — extract it from the promise
        resultPromise.catch((err) => {
            console.error(`[scraperRouter] Background run failed for ${source}:`, err);
        });
        // For admin convenience, we wait briefly to get the jobId then return
        const timeoutResult = await Promise.race([
            resultPromise,
            new Promise((resolve) => setTimeout(() => resolve({ jobId: 'pending', queued: true }), 500)),
        ]);
        res.status(202).json({
            message: `Scraper ${source} started`,
            ...timeoutResult,
        });
    }
    catch (err) {
        next(err);
    }
});
/**
 * GET /admin/scraper/jobs
 * List recent scraper jobs.
 */
router.get('/jobs', async (_req, res, next) => {
    try {
        const jobs = await (0, scraperJobService_1.listJobs)(100);
        res.json({ jobs, total: jobs.length });
    }
    catch (err) {
        next(err);
    }
});
/**
 * GET /admin/scraper/jobs/:id
 * Get a specific scraper job by ID.
 */
router.get('/jobs/:id', async (req, res, next) => {
    try {
        const job = await (0, scraperJobService_1.getJob)(req.params.id);
        if (!job) {
            res.status(404).json({ error: 'Job not found' });
            return;
        }
        res.json({ job });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
