"use strict";
// apps/api/src/routes/__tests__/admin-config.test.ts
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
vitest_1.vi.mock('../../middleware/auth', () => ({
    auth: (req, _res, next) => {
        req.user = { id: 'admin-user-id', role: 'admin' };
        next();
    },
}));
vitest_1.vi.mock('../../middleware/requireRole', () => ({
    requireRole: (_role) => (_req, _res, next) => next(),
}));
vitest_1.vi.mock('../../services/adminConfigService', () => ({
    getAllConfig: vitest_1.vi.fn(),
    getConfig: vitest_1.vi.fn(),
    setConfig: vitest_1.vi.fn(),
}));
const configService = __importStar(require("../../services/adminConfigService"));
const admin_config_1 = __importDefault(require("../admin-config"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use('/admin/config', admin_config_1.default);
(0, vitest_1.beforeEach)(() => vitest_1.vi.clearAllMocks());
(0, vitest_1.describe)('GET /admin/config', () => {
    (0, vitest_1.it)('returns all config rows', async () => {
        vitest_1.vi.mocked(configService.getAllConfig).mockResolvedValue([
            {
                key: 'maintenance_mode',
                value: false,
                updated_by: null,
                updated_at: '2024-01-01T00:00:00Z',
            },
        ]);
        const res = await (0, supertest_1.default)(app).get('/admin/config');
        (0, vitest_1.expect)(res.status).toBe(200);
        (0, vitest_1.expect)(res.body.config).toHaveLength(1);
        (0, vitest_1.expect)(res.body.config[0].key).toBe('maintenance_mode');
    });
    (0, vitest_1.it)('returns 500 on service error', async () => {
        vitest_1.vi.mocked(configService.getAllConfig).mockRejectedValue(new Error('DB error'));
        const res = await (0, supertest_1.default)(app).get('/admin/config');
        (0, vitest_1.expect)(res.status).toBe(500);
    });
});
(0, vitest_1.describe)('GET /admin/config/:key', () => {
    (0, vitest_1.it)('returns single config value', async () => {
        vitest_1.vi.mocked(configService.getConfig).mockResolvedValue(false);
        const res = await (0, supertest_1.default)(app).get('/admin/config/maintenance_mode');
        (0, vitest_1.expect)(res.status).toBe(200);
        (0, vitest_1.expect)(res.body.value).toBe(false);
        (0, vitest_1.expect)(res.body.key).toBe('maintenance_mode');
    });
    (0, vitest_1.it)('returns 404 when key not found', async () => {
        vitest_1.vi.mocked(configService.getConfig).mockRejectedValue(new Error('Config key not found: bad_key'));
        const res = await (0, supertest_1.default)(app).get('/admin/config/bad_key');
        (0, vitest_1.expect)(res.status).toBe(404);
    });
    (0, vitest_1.it)('returns 500 on unexpected error', async () => {
        vitest_1.vi.mocked(configService.getConfig).mockRejectedValue(new Error('Unexpected'));
        const res = await (0, supertest_1.default)(app).get('/admin/config/maintenance_mode');
        (0, vitest_1.expect)(res.status).toBe(500);
    });
});
(0, vitest_1.describe)('PATCH /admin/config/:key', () => {
    (0, vitest_1.it)('updates config value and returns updated row', async () => {
        vitest_1.vi.mocked(configService.setConfig).mockResolvedValue({
            key: 'maintenance_mode',
            value: true,
            updated_by: 'admin-user-id',
            updated_at: '2024-01-01T00:00:00Z',
        });
        const res = await (0, supertest_1.default)(app)
            .patch('/admin/config/maintenance_mode')
            .send({ value: true });
        (0, vitest_1.expect)(res.status).toBe(200);
        (0, vitest_1.expect)(res.body.config.value).toBe(true);
        (0, vitest_1.expect)(res.body.config.updated_by).toBe('admin-user-id');
    });
    (0, vitest_1.it)('returns 400 when value field is missing', async () => {
        const res = await (0, supertest_1.default)(app)
            .patch('/admin/config/maintenance_mode')
            .send({});
        (0, vitest_1.expect)(res.status).toBe(400);
        (0, vitest_1.expect)(res.body.error).toContain('value');
    });
    (0, vitest_1.it)('passes admin user id to setConfig', async () => {
        vitest_1.vi.mocked(configService.setConfig).mockResolvedValue({
            key: 'ntsa_fetch_enabled',
            value: true,
            updated_by: 'admin-user-id',
            updated_at: '2024-01-01T00:00:00Z',
        });
        await (0, supertest_1.default)(app)
            .patch('/admin/config/ntsa_fetch_enabled')
            .send({ value: true });
        (0, vitest_1.expect)(configService.setConfig).toHaveBeenCalledWith('ntsa_fetch_enabled', true, 'admin-user-id');
    });
    (0, vitest_1.it)('returns 500 on service error', async () => {
        vitest_1.vi.mocked(configService.setConfig).mockRejectedValue(new Error('DB error'));
        const res = await (0, supertest_1.default)(app)
            .patch('/admin/config/maintenance_mode')
            .send({ value: true });
        (0, vitest_1.expect)(res.status).toBe(500);
    });
});
