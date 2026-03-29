"use strict";
// apps/api/src/routes/admin-config.ts
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const requireRole_1 = require("../middleware/requireRole");
const adminConfigService_1 = require("../services/adminConfigService");
const router = (0, express_1.Router)();
// All admin-config routes require admin role
router.use(auth_1.auth, (0, requireRole_1.requireRole)('admin'));
// GET /admin/config — full config dump for admin UI
router.get('/', async (_req, res) => {
    try {
        const rows = await (0, adminConfigService_1.getAllConfig)();
        return res.json({ config: rows });
    }
    catch (err) {
        return res.status(500).json({ error: err.message });
    }
});
// GET /admin/config/:key — single key
router.get('/:key', async (req, res) => {
    try {
        const key = req.params.key;
        const value = await (0, adminConfigService_1.getConfig)(key);
        return res.json({ key, value });
    }
    catch (err) {
        const status = err.message.includes('not found') ? 404 : 500;
        return res.status(status).json({ error: err.message });
    }
});
// PATCH /admin/config/:key — update a single config key
router.patch('/:key', async (req, res) => {
    try {
        const key = req.params.key;
        const { value } = req.body;
        if (value === undefined) {
            return res.status(400).json({ error: '`value` is required' });
        }
        const adminId = req.user.id;
        const updated = await (0, adminConfigService_1.setConfig)(key, value, adminId);
        return res.json({ config: updated });
    }
    catch (err) {
        return res.status(500).json({ error: err.message });
    }
});
exports.default = router;
