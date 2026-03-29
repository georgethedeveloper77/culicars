"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// apps/api/src/tests/auth.test.ts
const vitest_1 = require("vitest");
const authService_1 = require("../services/authService");
// ── Mock prisma ──────────────────────────────────────────────────────────────
vitest_1.vi.mock('../lib/prisma', () => ({
    prisma: {
        profile: {
            findUnique: vitest_1.vi.fn(),
            create: vitest_1.vi.fn(),
            update: vitest_1.vi.fn(),
            upsert: vitest_1.vi.fn(),
            findMany: vitest_1.vi.fn(),
            count: vitest_1.vi.fn(),
        },
    },
}));
// ── Mock supabaseAdmin ───────────────────────────────────────────────────────
vitest_1.vi.mock('../config/supabase', () => ({
    supabaseAdmin: {
        auth: {
            admin: {
                getUserById: vitest_1.vi.fn(),
            },
        },
    },
}));
const prisma_1 = require("../lib/prisma");
const supabase_1 = require("../config/supabase");
const mockPrisma = vitest_1.vi.mocked(prisma_1.prisma);
const mockSupabase = vitest_1.vi.mocked(supabase_1.supabaseAdmin);
// ── Test data ────────────────────────────────────────────────────────────────
const USER_ID = '550e8400-e29b-41d4-a716-446655440000';
const ADMIN_ID = '550e8400-e29b-41d4-a716-446655440001';
const mockSupaUser = {
    data: {
        user: {
            id: USER_ID,
            email: 'user@test.com',
            phone: null,
            user_metadata: { full_name: 'Test User' },
        },
    },
    error: null,
};
const mockProfile = {
    id: USER_ID,
    email: 'user@test.com',
    display_name: 'Test User',
    phone: null,
    role: 'user',
    credits: 0,
    preferred_location_lat: null,
    preferred_location_lng: null,
    created_at: new Date(),
};
// ── completeProfile ──────────────────────────────────────────────────────────
(0, vitest_1.describe)('authService.completeProfile', () => {
    (0, vitest_1.beforeEach)(() => vitest_1.vi.clearAllMocks());
    (0, vitest_1.it)('creates a new profile on first login with role=user', async () => {
        vitest_1.vi.mocked(mockPrisma.profile.findUnique).mockResolvedValue(null);
        vitest_1.vi.mocked(mockSupabase.auth.admin.getUserById).mockResolvedValue(mockSupaUser);
        vitest_1.vi.mocked(mockPrisma.profile.create).mockResolvedValue(mockProfile);
        const result = await authService_1.authService.completeProfile(USER_ID, {});
        (0, vitest_1.expect)(mockPrisma.profile.create).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
            data: vitest_1.expect.objectContaining({ role: 'user', credits: 0 }),
        }));
        (0, vitest_1.expect)(result.role).toBe('user');
    });
    (0, vitest_1.it)('updates display_name if profile already exists', async () => {
        vitest_1.vi.mocked(mockPrisma.profile.findUnique).mockResolvedValue(mockProfile);
        vitest_1.vi.mocked(mockPrisma.profile.update).mockResolvedValue({
            ...mockProfile,
            display_name: 'Updated Name',
        });
        const result = await authService_1.authService.completeProfile(USER_ID, {
            display_name: 'Updated Name',
        });
        (0, vitest_1.expect)(mockPrisma.profile.create).not.toHaveBeenCalled();
        (0, vitest_1.expect)(mockPrisma.profile.update).toHaveBeenCalled();
    });
    (0, vitest_1.it)('uses full_name from Supabase metadata as display_name fallback', async () => {
        vitest_1.vi.mocked(mockPrisma.profile.findUnique).mockResolvedValue(null);
        vitest_1.vi.mocked(mockSupabase.auth.admin.getUserById).mockResolvedValue(mockSupaUser);
        vitest_1.vi.mocked(mockPrisma.profile.create).mockResolvedValue(mockProfile);
        await authService_1.authService.completeProfile(USER_ID, {});
        (0, vitest_1.expect)(mockPrisma.profile.create).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
            data: vitest_1.expect.objectContaining({ display_name: 'Test User' }),
        }));
    });
    (0, vitest_1.it)('falls back to email prefix when no name available', async () => {
        const noNameUser = {
            data: {
                user: {
                    id: USER_ID,
                    email: 'john@test.com',
                    phone: null,
                    user_metadata: {},
                },
            },
            error: null,
        };
        vitest_1.vi.mocked(mockPrisma.profile.findUnique).mockResolvedValue(null);
        vitest_1.vi.mocked(mockSupabase.auth.admin.getUserById).mockResolvedValue(noNameUser);
        vitest_1.vi.mocked(mockPrisma.profile.create).mockResolvedValue({
            ...mockProfile,
            display_name: 'john',
        });
        await authService_1.authService.completeProfile(USER_ID, {});
        (0, vitest_1.expect)(mockPrisma.profile.create).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
            data: vitest_1.expect.objectContaining({ display_name: 'john' }),
        }));
    });
    (0, vitest_1.it)('throws if Supabase user not found', async () => {
        vitest_1.vi.mocked(mockPrisma.profile.findUnique).mockResolvedValue(null);
        vitest_1.vi.mocked(mockSupabase.auth.admin.getUserById).mockResolvedValue({
            data: { user: null },
            error: new Error('User not found'),
        });
        await (0, vitest_1.expect)(authService_1.authService.completeProfile(USER_ID, {})).rejects.toThrow('Could not fetch Supabase user');
    });
});
// ── getProfile ───────────────────────────────────────────────────────────────
(0, vitest_1.describe)('authService.getProfile', () => {
    (0, vitest_1.beforeEach)(() => vitest_1.vi.clearAllMocks());
    (0, vitest_1.it)('returns profile for existing user', async () => {
        vitest_1.vi.mocked(mockPrisma.profile.findUnique).mockResolvedValue(mockProfile);
        const result = await authService_1.authService.getProfile(USER_ID);
        (0, vitest_1.expect)(result).toBeDefined();
        (0, vitest_1.expect)(mockPrisma.profile.findUnique).toHaveBeenCalledWith(vitest_1.expect.objectContaining({ where: { id: USER_ID } }));
    });
    (0, vitest_1.it)('returns null for unknown user', async () => {
        vitest_1.vi.mocked(mockPrisma.profile.findUnique).mockResolvedValue(null);
        const result = await authService_1.authService.getProfile('nonexistent-id');
        (0, vitest_1.expect)(result).toBeNull();
    });
});
// ── assignRole ───────────────────────────────────────────────────────────────
(0, vitest_1.describe)('authService.assignRole', () => {
    (0, vitest_1.beforeEach)(() => vitest_1.vi.clearAllMocks());
    (0, vitest_1.it)('assigns admin role', async () => {
        vitest_1.vi.mocked(mockPrisma.profile.update).mockResolvedValue({
            ...mockProfile,
            role: 'admin',
        });
        const result = await authService_1.authService.assignRole(USER_ID, 'admin');
        (0, vitest_1.expect)(result.role).toBe('admin');
        (0, vitest_1.expect)(mockPrisma.profile.update).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
            where: { id: USER_ID },
            data: { role: 'admin' },
        }));
    });
    (0, vitest_1.it)('assigns employee role', async () => {
        vitest_1.vi.mocked(mockPrisma.profile.update).mockResolvedValue({
            ...mockProfile,
            role: 'employee',
        });
        const result = await authService_1.authService.assignRole(USER_ID, 'employee');
        (0, vitest_1.expect)(result.role).toBe('employee');
    });
});
// ── listUsers ────────────────────────────────────────────────────────────────
(0, vitest_1.describe)('authService.listUsers', () => {
    (0, vitest_1.beforeEach)(() => vitest_1.vi.clearAllMocks());
    (0, vitest_1.it)('returns paginated users', async () => {
        const users = [mockProfile];
        vitest_1.vi.mocked(mockPrisma.profile.findMany).mockResolvedValue(users);
        vitest_1.vi.mocked(mockPrisma.profile.count).mockResolvedValue(1);
        const result = await authService_1.authService.listUsers({ page: 1, limit: 20 });
        (0, vitest_1.expect)(result.users).toHaveLength(1);
        (0, vitest_1.expect)(result.pagination.total).toBe(1);
        (0, vitest_1.expect)(result.pagination.pages).toBe(1);
    });
    (0, vitest_1.it)('filters by role when provided', async () => {
        vitest_1.vi.mocked(mockPrisma.profile.findMany).mockResolvedValue([]);
        vitest_1.vi.mocked(mockPrisma.profile.count).mockResolvedValue(0);
        await authService_1.authService.listUsers({ page: 1, limit: 20, role: 'admin' });
        (0, vitest_1.expect)(mockPrisma.profile.findMany).toHaveBeenCalledWith(vitest_1.expect.objectContaining({ where: { role: 'admin' } }));
    });
    (0, vitest_1.it)('calculates correct skip for page 2', async () => {
        vitest_1.vi.mocked(mockPrisma.profile.findMany).mockResolvedValue([]);
        vitest_1.vi.mocked(mockPrisma.profile.count).mockResolvedValue(0);
        await authService_1.authService.listUsers({ page: 2, limit: 10 });
        (0, vitest_1.expect)(mockPrisma.profile.findMany).toHaveBeenCalledWith(vitest_1.expect.objectContaining({ skip: 10, take: 10 }));
    });
});
// ── ensureProfile ─────────────────────────────────────────────────────────────
(0, vitest_1.describe)('authService.ensureProfile', () => {
    (0, vitest_1.beforeEach)(() => vitest_1.vi.clearAllMocks());
    (0, vitest_1.it)('returns existing profile role without creating', async () => {
        vitest_1.vi.mocked(mockPrisma.profile.findUnique).mockResolvedValue({ role: 'admin' });
        const result = await authService_1.authService.ensureProfile(ADMIN_ID);
        (0, vitest_1.expect)(result.role).toBe('admin');
        (0, vitest_1.expect)(mockPrisma.profile.create).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)('auto-provisions new profile with role=user', async () => {
        vitest_1.vi.mocked(mockPrisma.profile.findUnique).mockResolvedValue(null);
        vitest_1.vi.mocked(mockSupabase.auth.admin.getUserById).mockResolvedValue(mockSupaUser);
        vitest_1.vi.mocked(mockPrisma.profile.create).mockResolvedValue(mockProfile);
        const result = await authService_1.authService.ensureProfile(USER_ID);
        (0, vitest_1.expect)(result.role).toBe('user');
        (0, vitest_1.expect)(mockPrisma.profile.create).toHaveBeenCalledOnce();
    });
});
