"use strict";
// apps/api/src/routes/admin/demandQueue.ts
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const searchDemandQueueService_1 = require("../../services/searchDemandQueueService");
// TODO: replace with your actual auth middleware exports from ../../middleware/auth
// e.g. import { authenticateToken, requireAdminRole } from '../../middleware/auth';
// then add as route middleware: router.get('/', authenticateToken, requireAdminRole, async ...)
const router = (0, express_1.Router)();
/**
 * GET /admin/demand-queue
 * List unenriched demand queue entries. Paginated.
 * Query params: page, pageSize, state
 */
router.get('/', auth_1.auth, async (req, res) => {
    const page = parseInt(req.query.page ?? '1', 10);
    const pageSize = parseInt(req.query.pageSize ?? '25', 10);
    const state = req.query.state;
    const result = await (0, searchDemandQueueService_1.listQueue)({ page, pageSize, state });
    res.json({ success: true, data: result });
});
/**
 * PATCH /admin/demand-queue/mark-enriched
 * Manually clear a vehicle from the pending queue.
 */
router.patch('/mark-enriched', auth_1.auth, async (req, res) => {
    const { vin, plate } = req.body;
    if (!vin && !plate) {
        return res.status(400).json({ success: false, error: 'Provide vin or plate' });
    }
    await (0, searchDemandQueueService_1.markEnriched)({ vin, plate });
    return res.json({ success: true });
});
exports.default = router;
