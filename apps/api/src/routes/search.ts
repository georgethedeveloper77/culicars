// apps/api/src/routes/search.ts
// GET /search?q=KCA123A&type=auto|plate|vin
// Public — optionalAuth (guests ok, logged-in users get personalization later)
// Stolen alert ALWAYS returned FREE

import { Router } from 'express';
import { searchQuerySchema } from '../validators/searchValidator';
import { search } from '../services/searchService';

const router: import("express").Router = Router();

router.get('/', async (req, res, next) => {
  try {
    const parsed = searchQuerySchema.safeParse(req.query);

    if (!parsed.success) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Invalid search query',
        details: parsed.error.flatten().fieldErrors,
        statusCode: 400,
      });
    }

    const { q, type } = parsed.data;
    const result = await search(q, { forceType: type });

    return res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

export default router;
