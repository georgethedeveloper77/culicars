// apps/api/src/routes/reports.ts

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import {
  generateReport,
  recordReportAccess,
  hasUnlockedReport,
} from '../services/reportGenerator.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

// ─────────────────────────────────────────────
// GET /reports/by-vin/:vin
// Returns locked or unlocked canonical report
// ─────────────────────────────────────────────
router.get('/by-vin/:vin', requireAuth, async (req: Request, res: Response) => {
  const { vin } = req.params;
  const userId: string = (req as any).user?.id;

  if (!vin || vin.length < 5) {
    return res.status(400).json({ error: 'Invalid VIN' });
  }

  try {
    // Determine if this user has unlocked this VIN's report
    const existingReport = await (prisma as any).vehicle_report.findFirst({
      where: { vin },
    });

    const reportId = existingReport?.id ?? null;
    const isUnlocked = reportId
      ? await hasUnlockedReport(reportId, userId)
      : false;

    const report = await generateReport(vin, isUnlocked);

    return res.json({ report, isUnlocked });
  } catch (err) {
    console.error('[reports/by-vin] error:', err);
    return res.status(500).json({ error: 'Failed to generate report' });
  }
});

// ─────────────────────────────────────────────
// GET /reports/:id/preview
// Locked preview — always locked sections, no auth required
// ─────────────────────────────────────────────
router.get('/:id/preview', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const row = await (prisma as any).vehicle_report.findUnique({
      where: { id },
    });

    if (!row) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // Always return locked version for preview
    const report = await generateReport(row.vin, false);
    return res.json({ report, isUnlocked: false });
  } catch (err) {
    console.error('[reports/preview] error:', err);
    return res.status(500).json({ error: 'Failed to load report preview' });
  }
});

// ─────────────────────────────────────────────
// POST /reports/:id/unlock
// Deduct 1 credit and record access
// ─────────────────────────────────────────────
router.post('/:id/unlock', requireAuth, async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId: string = (req as any).user?.id;

  try {
    const row = await (prisma as any).vehicle_report.findUnique({
      where: { id },
    });

    if (!row) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // Idempotent: already unlocked
    const alreadyUnlocked = await hasUnlockedReport(id, userId);
    if (alreadyUnlocked) {
      const report = await generateReport(row.vin, true);
      return res.json({ report, isUnlocked: true, creditsDeducted: 0 });
    }

    // Check credit balance
    const user = await (prisma as any).user.findUnique({ where: { id: userId } });
    if (!user || user.credits < 1) {
      return res.status(402).json({ error: 'Insufficient credits' });
    }

    // Deduct credit (append-only ledger)
    await (prisma as any).credit_transaction.create({
      data: {
        user_id: userId,
        amount: -1,
        type: 'report_unlock',
        reference: id,
        created_at: new Date(),
      },
    });

    // Update balance
    await (prisma as any).user.update({
      where: { id: userId },
      data: { credits: { decrement: 1 } },
    });

    // Record access
    await recordReportAccess(id, userId);

    const report = await generateReport(row.vin, true);
    return res.json({ report, isUnlocked: true, creditsDeducted: 1 });
  } catch (err) {
    console.error('[reports/unlock] error:', err);
    return res.status(500).json({ error: 'Failed to unlock report' });
  }
});

// ─────────────────────────────────────────────
// GET /reports/saved
// Reports this user has unlocked (for Profile)
// ─────────────────────────────────────────────
router.get('/saved', requireAuth, async (req: Request, res: Response) => {
  const userId: string = (req as any).user?.id;

  try {
    const accesses = await (prisma as any).report_access.findMany({
      where: { user_id: userId },
      orderBy: { accessed_at: 'desc' },
      take: 50,
    });

    const reportIds = accesses.map((a: any) => a.report_id);
    const reports = await (prisma as any).vehicle_report.findMany({
      where: { id: { in: reportIds } },
    });

    // Sort to match access order
    const sorted = reportIds
      .map((rid: string) => reports.find((r: any) => r.id === rid))
      .filter(Boolean)
      .map((r: any) => ({
        id: r.id,
        vin: r.vin,
        plate: r.plate,
        state: r.state,
        riskScore: r.risk_score,
        riskLevel: r.risk_level,
        updatedAt: r.updated_at,
      }));

    return res.json({ reports: sorted });
  } catch (err) {
    console.error('[reports/saved] error:', err);
    return res.status(500).json({ error: 'Failed to load saved reports' });
  }
});

export default router;
