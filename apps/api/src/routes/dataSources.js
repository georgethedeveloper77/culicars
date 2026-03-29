"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
// apps/api/src/routes/dataSources.ts
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const ds = __importStar(require("../services/dataSourcesService"));
const router = (0, express_1.Router)();
router.use(auth_1.auth, (req, res, next) => { if (req.user?.role !== 'admin')
    return res.status(403).json({ error: 'Forbidden' }); next(); });
router.get('/', async (_req, res) => {
    try {
        res.json({ data: await ds.listDataSources() });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
router.get('/:id', async (req, res) => {
    try {
        const source = await ds.getDataSource(req.params.id);
        if (!source)
            return res.status(404).json({ error: 'Data source not found' });
        res.json({ data: source });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
router.post('/', async (req, res) => {
    try {
        const { name, type, parser_type, schedule, credentials, enabled } = req.body;
        if (!name || !type || !parser_type) {
            return res.status(400).json({ error: 'name, type, and parser_type are required' });
        }
        res.status(201).json({ data: await ds.createDataSource({ name, type, parser_type, schedule, credentials, enabled }) });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
router.patch('/:id', async (req, res) => {
    try {
        res.json({ data: await ds.updateDataSource(req.params.id, req.body) });
    }
    catch (err) {
        if (err.code === 'P2025')
            return res.status(404).json({ error: 'Data source not found' });
        res.status(500).json({ error: err.message });
    }
});
router.delete('/:id', async (req, res) => {
    try {
        await ds.deleteDataSource(req.params.id);
        res.json({ message: 'Deleted' });
    }
    catch (err) {
        if (err.code === 'P2025')
            return res.status(404).json({ error: 'Data source not found' });
        res.status(500).json({ error: err.message });
    }
});
router.post('/:id/run', async (req, res) => {
    try {
        res.json({ data: await ds.triggerManualRun(req.params.id) });
    }
    catch (err) {
        const status = err.message === 'Data source not found' ? 404 : 500;
        res.status(status).json({ error: err.message });
    }
});
exports.default = router;
