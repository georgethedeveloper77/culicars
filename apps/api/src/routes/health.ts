// apps/api/src/routes/health.ts
import { Router } from 'express';
import prisma from '../lib/prisma';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    // Test DB connectivity
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      status: 'ok',
      service: 'culicars-api',
      timestamp: new Date().toISOString(),
      database: 'connected',
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      service: 'culicars-api',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
    });
  }
});

export default router;
