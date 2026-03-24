"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// apps/api/src/routes/health.ts
const express_1 = require("express");
const prisma_1 = __importDefault(require("../lib/prisma"));
const router = (0, express_1.Router)();
router.get('/', async (_req, res) => {
    try {
        // Test DB connectivity
        await prisma_1.default.$queryRaw `SELECT 1`;
        res.json({
            status: 'ok',
            service: 'culicars-api',
            timestamp: new Date().toISOString(),
            database: 'connected',
        });
    }
    catch (error) {
        res.status(503).json({
            status: 'error',
            service: 'culicars-api',
            timestamp: new Date().toISOString(),
            database: 'disconnected',
        });
    }
});
exports.default = router;
