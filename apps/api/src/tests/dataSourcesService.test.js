"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// apps/api/src/tests/dataSourcesService.test.ts
const vitest_1 = require("vitest");
// ── Mock prisma ───────────────────────────────────────────────────────────────
const mockSource = {
    id: 'ds-1',
    name: 'Kenya Motor Reg',
    type: 'web',
    parser_type: 'kenyaMotorReg',
    credentials_enc: null,
    schedule: '0 2 * * *',
    enabled: true,
    last_run_at: null,
    last_status: null,
    created_at: new Date(),
    updated_at: new Date(),
};
vitest_1.vi.mock('@culicars/database', () => ({
    prisma: {
        dataSource: {
            findMany: vitest_1.vi.fn(),
            findUnique: vitest_1.vi.fn(),
            create: vitest_1.vi.fn(),
            update: vitest_1.vi.fn(),
            delete: vitest_1.vi.fn(),
        },
    },
}));
// ── Mock crypto so tests don't need CREDENTIALS_ENCRYPTION_KEY ───────────────
vitest_1.vi.mock('crypto', async () => {
    const actual = await vitest_1.vi.importActual('crypto');
    return {
        ...actual,
        default: {
            ...actual,
            randomBytes: () => Buffer.alloc(12),
            createCipheriv: () => ({
                update: () => Buffer.from('encrypted'),
                final: () => Buffer.from(''),
                getAuthTag: () => Buffer.from('tag12345'),
            }),
            createDecipheriv: () => ({
                update: () => Buffer.from('{"key":"val"}'),
                final: () => Buffer.from(''),
                setAuthTag: vitest_1.vi.fn(),
            }),
        },
    };
});
const database_1 = require("@culicars/database");
const dataSourcesService_1 = require("../services/dataSourcesService");
(0, vitest_1.beforeEach)(() => {
    vitest_1.vi.clearAllMocks();
    process.env.CREDENTIALS_ENCRYPTION_KEY = 'a'.repeat(64); // 32-byte hex
});
(0, vitest_1.describe)('listDataSources', () => {
    (0, vitest_1.it)('returns sources without credentials_enc', async () => {
        vitest_1.vi.mocked(database_1.prisma.dataSource.findMany).mockResolvedValue([
            { ...mockSource, credentials_enc: 'encrypted-blob' },
        ]);
        const result = await (0, dataSourcesService_1.listDataSources)();
        (0, vitest_1.expect)(result[0]).not.toHaveProperty('credentials_enc');
        (0, vitest_1.expect)(result[0].has_credentials).toBe(true);
    });
    (0, vitest_1.it)('marks has_credentials false when no credentials stored', async () => {
        vitest_1.vi.mocked(database_1.prisma.dataSource.findMany).mockResolvedValue([mockSource]);
        const result = await (0, dataSourcesService_1.listDataSources)();
        (0, vitest_1.expect)(result[0].has_credentials).toBe(false);
    });
});
(0, vitest_1.describe)('getDataSource', () => {
    (0, vitest_1.it)('returns null for unknown id', async () => {
        vitest_1.vi.mocked(database_1.prisma.dataSource.findUnique).mockResolvedValue(null);
        const result = await (0, dataSourcesService_1.getDataSource)('nonexistent');
        (0, vitest_1.expect)(result).toBeNull();
    });
    (0, vitest_1.it)('strips credentials_enc from result', async () => {
        vitest_1.vi.mocked(database_1.prisma.dataSource.findUnique).mockResolvedValue({
            ...mockSource,
            credentials_enc: 'blob',
        });
        const result = await (0, dataSourcesService_1.getDataSource)('ds-1');
        (0, vitest_1.expect)(result).not.toHaveProperty('credentials_enc');
        (0, vitest_1.expect)(result?.has_credentials).toBe(true);
    });
});
(0, vitest_1.describe)('createDataSource', () => {
    (0, vitest_1.it)('creates without credentials', async () => {
        vitest_1.vi.mocked(database_1.prisma.dataSource.create).mockResolvedValue(mockSource);
        const result = await (0, dataSourcesService_1.createDataSource)({ name: 'Test', type: 'web', parser_type: 'test' });
        (0, vitest_1.expect)(database_1.prisma.dataSource.create).toHaveBeenCalledWith(vitest_1.expect.objectContaining({ data: vitest_1.expect.objectContaining({ credentials_enc: null }) }));
        (0, vitest_1.expect)(result).not.toHaveProperty('credentials_enc');
    });
    (0, vitest_1.it)('encrypts credentials on create', async () => {
        vitest_1.vi.mocked(database_1.prisma.dataSource.create).mockResolvedValue(mockSource);
        await (0, dataSourcesService_1.createDataSource)({
            name: 'Test',
            type: 'web',
            parser_type: 'test',
            credentials: { api_key: 'secret' },
        });
        const call = vitest_1.vi.mocked(database_1.prisma.dataSource.create).mock.calls[0][0];
        (0, vitest_1.expect)(call.data.credentials_enc).toBeTruthy();
        (0, vitest_1.expect)(call.data.credentials_enc).not.toContain('secret');
    });
});
(0, vitest_1.describe)('updateDataSource', () => {
    (0, vitest_1.it)('updates name only', async () => {
        vitest_1.vi.mocked(database_1.prisma.dataSource.update).mockResolvedValue({ ...mockSource, name: 'New Name' });
        await (0, dataSourcesService_1.updateDataSource)('ds-1', { name: 'New Name' });
        const call = vitest_1.vi.mocked(database_1.prisma.dataSource.update).mock.calls[0][0];
        (0, vitest_1.expect)(call.data).toHaveProperty('name', 'New Name');
        (0, vitest_1.expect)(call.data).not.toHaveProperty('credentials_enc');
    });
    (0, vitest_1.it)('does not overwrite credentials when not provided', async () => {
        vitest_1.vi.mocked(database_1.prisma.dataSource.update).mockResolvedValue(mockSource);
        await (0, dataSourcesService_1.updateDataSource)('ds-1', { enabled: false });
        const call = vitest_1.vi.mocked(database_1.prisma.dataSource.update).mock.calls[0][0];
        (0, vitest_1.expect)(call.data).not.toHaveProperty('credentials_enc');
    });
});
(0, vitest_1.describe)('deleteDataSource', () => {
    (0, vitest_1.it)('calls prisma delete', async () => {
        vitest_1.vi.mocked(database_1.prisma.dataSource.delete).mockResolvedValue(mockSource);
        await (0, dataSourcesService_1.deleteDataSource)('ds-1');
        (0, vitest_1.expect)(database_1.prisma.dataSource.delete).toHaveBeenCalledWith({ where: { id: 'ds-1' } });
    });
});
