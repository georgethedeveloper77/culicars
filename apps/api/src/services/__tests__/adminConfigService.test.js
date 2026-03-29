"use strict";
// apps/api/src/services/__tests__/adminConfigService.test.ts
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
const vitest_1 = require("vitest");
// Mock ../lib/prisma before importing the service
vitest_1.vi.mock('../../lib/prisma', () => {
    const mockFindUnique = vitest_1.vi.fn();
    const mockFindMany = vitest_1.vi.fn();
    const mockUpsert = vitest_1.vi.fn();
    return {
        default: {
            adminConfig: {
                findUnique: mockFindUnique,
                findMany: mockFindMany,
                upsert: mockUpsert,
            },
        },
        __mocks: { mockFindUnique, mockFindMany, mockUpsert },
    };
});
const prismaModule = __importStar(require("../../lib/prisma"));
const adminConfigService_1 = require("../adminConfigService");
function getMocks() {
    return prismaModule.__mocks;
}
(0, vitest_1.beforeEach)(() => {
    (0, adminConfigService_1.invalidateCache)();
    const { mockFindUnique, mockFindMany, mockUpsert } = getMocks();
    mockFindUnique.mockReset();
    mockFindMany.mockReset();
    mockUpsert.mockReset();
});
(0, vitest_1.describe)('getConfig', () => {
    (0, vitest_1.it)('returns parsed value from DB', async () => {
        const { mockFindUnique } = getMocks();
        mockFindUnique.mockResolvedValue({
            key: 'ntsa_fetch_enabled',
            value: false,
            updated_by: null,
            updated_at: new Date(),
        });
        const result = await (0, adminConfigService_1.getConfig)('ntsa_fetch_enabled');
        (0, vitest_1.expect)(result).toBe(false);
        (0, vitest_1.expect)(mockFindUnique).toHaveBeenCalledWith({
            where: { key: 'ntsa_fetch_enabled' },
        });
    });
    (0, vitest_1.it)('returns cached value on second call without hitting DB again', async () => {
        const { mockFindUnique } = getMocks();
        mockFindUnique.mockResolvedValue({
            key: 'maintenance_mode',
            value: false,
            updated_by: null,
            updated_at: new Date(),
        });
        await (0, adminConfigService_1.getConfig)('maintenance_mode');
        await (0, adminConfigService_1.getConfig)('maintenance_mode');
        (0, vitest_1.expect)(mockFindUnique).toHaveBeenCalledTimes(1);
    });
    (0, vitest_1.it)('throws when key does not exist in DB', async () => {
        const { mockFindUnique } = getMocks();
        mockFindUnique.mockResolvedValue(null);
        await (0, vitest_1.expect)((0, adminConfigService_1.getConfig)('ntsa_fetch_enabled')).rejects.toThrow('Config key not found');
    });
});
(0, vitest_1.describe)('setConfig', () => {
    (0, vitest_1.it)('upserts value and returns updated row', async () => {
        const { mockUpsert } = getMocks();
        const now = new Date();
        mockUpsert.mockResolvedValue({
            key: 'maintenance_mode',
            value: true,
            updated_by: 'user-123',
            updated_at: now,
        });
        const result = await (0, adminConfigService_1.setConfig)('maintenance_mode', true, 'user-123');
        (0, vitest_1.expect)(result.value).toBe(true);
        (0, vitest_1.expect)(result.updated_by).toBe('user-123');
        (0, vitest_1.expect)(mockUpsert).toHaveBeenCalled();
    });
    (0, vitest_1.it)('invalidates cache so next getConfig hits DB', async () => {
        const { mockUpsert, mockFindUnique } = getMocks();
        const now = new Date();
        mockFindUnique.mockResolvedValueOnce({
            key: 'maintenance_mode',
            value: false,
            updated_by: null,
            updated_at: now,
        });
        await (0, adminConfigService_1.getConfig)('maintenance_mode'); // seeds cache
        mockUpsert.mockResolvedValue({
            key: 'maintenance_mode',
            value: true,
            updated_by: 'user-123',
            updated_at: now,
        });
        await (0, adminConfigService_1.setConfig)('maintenance_mode', true, 'user-123'); // busts cache
        mockFindUnique.mockResolvedValueOnce({
            key: 'maintenance_mode',
            value: true,
            updated_by: 'user-123',
            updated_at: now,
        });
        await (0, adminConfigService_1.getConfig)('maintenance_mode'); // must hit DB again
        (0, vitest_1.expect)(mockFindUnique).toHaveBeenCalledTimes(2);
    });
});
(0, vitest_1.describe)('getAllConfig', () => {
    (0, vitest_1.it)('returns all rows mapped correctly', async () => {
        const { mockFindMany } = getMocks();
        mockFindMany.mockResolvedValue([
            { key: 'maintenance_mode', value: false, updated_by: null, updated_at: new Date('2024-01-01') },
            { key: 'ntsa_fetch_enabled', value: false, updated_by: null, updated_at: new Date('2024-01-01') },
        ]);
        const rows = await (0, adminConfigService_1.getAllConfig)();
        (0, vitest_1.expect)(rows).toHaveLength(2);
        (0, vitest_1.expect)(rows[0].key).toBe('maintenance_mode');
        (0, vitest_1.expect)(typeof rows[0].updated_at).toBe('string');
    });
});
(0, vitest_1.describe)('getEnabledProvidersForPlatform', () => {
    (0, vitest_1.it)('returns web providers for platform=web', async () => {
        const { mockFindUnique } = getMocks();
        mockFindUnique.mockResolvedValue({
            key: 'payment_providers_web',
            value: ['mpesa', 'stripe'],
            updated_by: null,
            updated_at: new Date(),
        });
        const providers = await (0, adminConfigService_1.getEnabledProvidersForPlatform)('web');
        (0, vitest_1.expect)(providers).toEqual(['mpesa', 'stripe']);
    });
    (0, vitest_1.it)('returns app providers for platform=app', async () => {
        const { mockFindUnique } = getMocks();
        mockFindUnique.mockResolvedValue({
            key: 'payment_providers_app',
            value: ['mpesa', 'apple_iap'],
            updated_by: null,
            updated_at: new Date(),
        });
        const providers = await (0, adminConfigService_1.getEnabledProvidersForPlatform)('app');
        (0, vitest_1.expect)(providers).toEqual(['mpesa', 'apple_iap']);
    });
});
(0, vitest_1.describe)('getCreditPacks', () => {
    (0, vitest_1.it)('returns web packs for platform=web', async () => {
        const { mockFindUnique } = getMocks();
        const packs = [{ id: 'pack_5', credits: 5, price_kes: 500, price_usd: 4 }];
        mockFindUnique.mockResolvedValue({
            key: 'credit_packs_web',
            value: packs,
            updated_by: null,
            updated_at: new Date(),
        });
        const result = await (0, adminConfigService_1.getCreditPacks)('web');
        (0, vitest_1.expect)(result).toEqual(packs);
    });
    (0, vitest_1.it)('returns app packs for platform=app', async () => {
        const { mockFindUnique } = getMocks();
        const packs = [{ id: 'pack_5', credits: 5, price_usd: 4.99 }];
        mockFindUnique.mockResolvedValue({
            key: 'credit_packs_app',
            value: packs,
            updated_by: null,
            updated_at: new Date(),
        });
        const result = await (0, adminConfigService_1.getCreditPacks)('app');
        (0, vitest_1.expect)(result).toEqual(packs);
    });
});
