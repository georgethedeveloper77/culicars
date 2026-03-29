// apps/api/src/routes/dataSources.ts
import { Router, Request, Response } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import * as ds from '../services/dataSourcesService';

const router = Router();

router.use(requireAuth, requireRole('admin'));

router.get('/', async (_req: Request, res: Response) => {
  try {
    res.json({ data: await ds.listDataSources() });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const source = await ds.getDataSource(req.params.id);
    if (!source) return res.status(404).json({ error: 'Data source not found' });
    res.json({ data: source });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, type, parser_type, schedule, credentials, enabled } = req.body;
    if (!name || !type || !parser_type) {
      return res.status(400).json({ error: 'name, type, and parser_type are required' });
    }
    res.status(201).json({ data: await ds.createDataSource({ name, type, parser_type, schedule, credentials, enabled }) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id', async (req: Request, res: Response) => {
  try {
    res.json({ data: await ds.updateDataSource(req.params.id, req.body) });
  } catch (err: any) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Data source not found' });
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await ds.deleteDataSource(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err: any) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Data source not found' });
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/run', async (req: Request, res: Response) => {
  try {
    res.json({ data: await ds.triggerManualRun(req.params.id) });
  } catch (err: any) {
    const status = err.message === 'Data source not found' ? 404 : 500;
    res.status(status).json({ error: err.message });
  }
});

export default router;
