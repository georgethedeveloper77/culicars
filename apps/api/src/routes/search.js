"use strict";
// apps/api/src/routes/search.ts
// GET /search?q=KCA123A&type=auto|plate|vin
// Public — optionalAuth (guests ok, logged-in users get personalization later)
// Stolen alert ALWAYS returned FREE
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const searchValidator_1 = require("../validators/searchValidator");
const searchService_1 = require("../services/searchService");
const router = (0, express_1.Router)();
router.get('/', async (req, res, next) => {
    try {
        const parsed = searchValidator_1.searchQuerySchema.safeParse(req.query);
        if (!parsed.success) {
            return res.status(400).json({
                error: 'VALIDATION_ERROR',
                message: 'Invalid search query',
                details: parsed.error.flatten().fieldErrors,
                statusCode: 400,
            });
        }
        const { q, type } = parsed.data;
        const result = await (0, searchService_1.search)(q, { forceType: type });
        return res.json({ success: true, data: result });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
