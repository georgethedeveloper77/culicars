// apps/api/src/routes/reports.ts

import { Router, Request, Response } from 'express';
import {
  generateReport,
  recordReportAccess,
  hasUnlockedReport,
} from '../services/reportGenerator.js';
import { auth, optionalAuth } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';

const router: import("express").Router = Router();

// GET /reports/by-vin/:vin
router.get('/by-vin/:vin', optionalAuth, async (req: Request, res: Response) => {
  const { vin } = req.params;
  const userId: string = (req as any).user?.id;
  if (!vin || vin.length < 5) return res.status(400).json({ error: 'Invalid VIN' });
  try {
    const existingReport = await (prisma as any).reports.findFirst({ where: { vin }, select: { id: true } });
    const reportId = existingReport?.id ?? null;
    const isUnlocked = reportId && userId ? await hasUnlockedReport(reportId, userId) : false;
    const report = await generateReport(vin, isUnlocked);
    return res.json({ success: true, data: report, isUnlocked });
  } catch (err) {
    console.error('[reports/by-vin] error:', (err as any)?.message, (err as any)?.stack);
    return res.status(500).json({ error: 'Failed to generate report' });
  }
});

// GET /reports/saved
router.get('/saved', auth, async (req: Request, res: Response) => {
  const userId: string = (req as any).user?.id;
  try {
    const accesses = await (prisma as any).report_unlocks.findMany({
      where: { user_id: userId }, orderBy: { created_at: 'desc' }, take: 50,
    });
    const reportIds = accesses.map((a: any) => a.report_id);
    const reports = await (prisma as any).reports.findMany({
      where: { id: { in: reportIds } },
      select: { id: true, vin: true, status: true, risk_score: true, risk_level: true, updated_at: true },
    });
    const sorted = reportIds.map((rid: string) => reports.find((r: any) => r.id === rid)).filter(Boolean);
    return res.json({ success: true, data: sorted });
  } catch (err) {
    console.error('[reports/saved] error:', (err as any)?.message);
    return res.status(500).json({ error: 'Failed to load saved reports' });
  }
});

// GET /reports/:id/preview
router.get('/:id/preview', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const row = await (prisma as any).reports.findUnique({ where: { id }, select: { vin: true } });
    if (!row) return res.status(404).json({ error: 'Report not found' });
    const report = await generateReport(row.vin, false);
    return res.json({ success: true, data: report, isUnlocked: false });
  } catch (err) {
    console.error('[reports/preview] error:', (err as any)?.message);
    return res.status(500).json({ error: 'Failed to load report preview' });
  }
});

// GET /reports/:id
router.get('/:id', optionalAuth, async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId: string = (req as any).user?.id;
  try {
    const row = await (prisma as any).reports.findUnique({ where: { id }, select: { vin: true } });
    if (!row) return res.status(404).json({ error: 'Report not found' });
    const isUnlocked = userId ? await hasUnlockedReport(id, userId) : false;
    const report = await generateReport(row.vin, isUnlocked);
    return res.json({ success: true, data: report, isUnlocked });
  } catch (err) {
    console.error('[reports/:id] error:', (err as any)?.message);
    return res.status(500).json({ error: 'Failed to load report' });
  }
});

// POST /reports/:id/unlock
router.post('/:id/unlock', auth, async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId: string = (req as any).user?.id;
  try {
    const row = await (prisma as any).reports.findUnique({ where: { id }, select: { vin: true } });
    if (!row) return res.status(404).json({ error: 'Report not found' });
    const alreadyUnlocked = await hasUnlockedReport(id, userId);
    if (alreadyUnlocked) {
      const report = await generateReport(row.vin, true);
      return res.json({ success: true, data: report, isUnlocked: true, creditsDeducted: 0 });
    }
    const wallet = await (prisma as any).wallets.findUnique({ where: { user_id: userId } });
    if (!wallet || wallet.balance < 1) return res.status(402).json({ error: 'Insufficient credits' });
    await (prisma as any).credit_ledger.create({
      data: {
        user_id: userId, amount: -1, type: 'REPORT_UNLOCK',
        description: `Report unlock: ${id}`,
        provider_ref: `unlock_${id}_${userId}`,
        created_at: new Date(),
      },
    });
    await (prisma as any).wallets.update({ where: { user_id: userId }, data: { balance: { decrement: 1 } } });
    await recordReportAccess(id, userId);
    const report = await generateReport(row.vin, true);
    return res.json({ success: true, data: report, isUnlocked: true, creditsDeducted: 1 });
  } catch (err) {
    console.error('[reports/unlock] error:', (err as any)?.message, (err as any)?.stack);
    return res.status(500).json({ error: 'Failed to unlock report' });
  }
});

export default router;
