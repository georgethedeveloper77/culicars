// apps/api/src/tests/auth.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authService } from '../services/authService';

// ── Mock prisma ──────────────────────────────────────────────────────────────
vi.mock('../lib/prisma', () => ({
  prisma: {
    profile: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

// ── Mock supabaseAdmin ───────────────────────────────────────────────────────
vi.mock('../config/supabase', () => ({
  supabaseAdmin: {
    auth: {
      admin: {
        getUserById: vi.fn(),
      },
    },
  },
}));

import { prisma } from '../lib/prisma';
import { supabaseAdmin } from '../config/supabase';

const mockPrisma = vi.mocked(prisma);
const mockSupabase = vi.mocked(supabaseAdmin);

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
describe('authService.completeProfile', () => {
  beforeEach(() => vi.clearAllMocks());

  it('creates a new profile on first login with role=user', async () => {
    vi.mocked(mockPrisma.profile.findUnique).mockResolvedValue(null);
    vi.mocked(mockSupabase.auth.admin.getUserById).mockResolvedValue(mockSupaUser as any);
    vi.mocked(mockPrisma.profile.create).mockResolvedValue(mockProfile as any);

    const result = await authService.completeProfile(USER_ID, {});

    expect(mockPrisma.profile.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ role: 'user', credits: 0 }),
      })
    );
    expect(result.role).toBe('user');
  });

  it('updates display_name if profile already exists', async () => {
    vi.mocked(mockPrisma.profile.findUnique).mockResolvedValue(mockProfile as any);
    vi.mocked(mockPrisma.profile.update).mockResolvedValue({
      ...mockProfile,
      display_name: 'Updated Name',
    } as any);

    const result = await authService.completeProfile(USER_ID, {
      display_name: 'Updated Name',
    });

    expect(mockPrisma.profile.create).not.toHaveBeenCalled();
    expect(mockPrisma.profile.update).toHaveBeenCalled();
  });

  it('uses full_name from Supabase metadata as display_name fallback', async () => {
    vi.mocked(mockPrisma.profile.findUnique).mockResolvedValue(null);
    vi.mocked(mockSupabase.auth.admin.getUserById).mockResolvedValue(mockSupaUser as any);
    vi.mocked(mockPrisma.profile.create).mockResolvedValue(mockProfile as any);

    await authService.completeProfile(USER_ID, {});

    expect(mockPrisma.profile.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ display_name: 'Test User' }),
      })
    );
  });

  it('falls back to email prefix when no name available', async () => {
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

    vi.mocked(mockPrisma.profile.findUnique).mockResolvedValue(null);
    vi.mocked(mockSupabase.auth.admin.getUserById).mockResolvedValue(noNameUser as any);
    vi.mocked(mockPrisma.profile.create).mockResolvedValue({
      ...mockProfile,
      display_name: 'john',
    } as any);

    await authService.completeProfile(USER_ID, {});

    expect(mockPrisma.profile.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ display_name: 'john' }),
      })
    );
  });

  it('throws if Supabase user not found', async () => {
    vi.mocked(mockPrisma.profile.findUnique).mockResolvedValue(null);
    vi.mocked(mockSupabase.auth.admin.getUserById).mockResolvedValue({
      data: { user: null },
      error: new Error('User not found'),
    } as any);

    await expect(authService.completeProfile(USER_ID, {})).rejects.toThrow(
      'Could not fetch Supabase user'
    );
  });
});

// ── getProfile ───────────────────────────────────────────────────────────────
describe('authService.getProfile', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns profile for existing user', async () => {
    vi.mocked(mockPrisma.profile.findUnique).mockResolvedValue(mockProfile as any);

    const result = await authService.getProfile(USER_ID);

    expect(result).toBeDefined();
    expect(mockPrisma.profile.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: USER_ID } })
    );
  });

  it('returns null for unknown user', async () => {
    vi.mocked(mockPrisma.profile.findUnique).mockResolvedValue(null);

    const result = await authService.getProfile('nonexistent-id');
    expect(result).toBeNull();
  });
});

// ── assignRole ───────────────────────────────────────────────────────────────
describe('authService.assignRole', () => {
  beforeEach(() => vi.clearAllMocks());

  it('assigns admin role', async () => {
    vi.mocked(mockPrisma.profile.update).mockResolvedValue({
      ...mockProfile,
      role: 'admin',
    } as any);

    const result = await authService.assignRole(USER_ID, 'admin');
    expect(result.role).toBe('admin');
    expect(mockPrisma.profile.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: USER_ID },
        data: { role: 'admin' },
      })
    );
  });

  it('assigns employee role', async () => {
    vi.mocked(mockPrisma.profile.update).mockResolvedValue({
      ...mockProfile,
      role: 'employee',
    } as any);

    const result = await authService.assignRole(USER_ID, 'employee');
    expect(result.role).toBe('employee');
  });
});

// ── listUsers ────────────────────────────────────────────────────────────────
describe('authService.listUsers', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns paginated users', async () => {
    const users = [mockProfile];
    vi.mocked(mockPrisma.profile.findMany).mockResolvedValue(users as any);
    vi.mocked(mockPrisma.profile.count).mockResolvedValue(1);

    const result = await authService.listUsers({ page: 1, limit: 20 });

    expect(result.users).toHaveLength(1);
    expect(result.pagination.total).toBe(1);
    expect(result.pagination.pages).toBe(1);
  });

  it('filters by role when provided', async () => {
    vi.mocked(mockPrisma.profile.findMany).mockResolvedValue([]);
    vi.mocked(mockPrisma.profile.count).mockResolvedValue(0);

    await authService.listUsers({ page: 1, limit: 20, role: 'admin' });

    expect(mockPrisma.profile.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { role: 'admin' } })
    );
  });

  it('calculates correct skip for page 2', async () => {
    vi.mocked(mockPrisma.profile.findMany).mockResolvedValue([]);
    vi.mocked(mockPrisma.profile.count).mockResolvedValue(0);

    await authService.listUsers({ page: 2, limit: 10 });

    expect(mockPrisma.profile.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 10, take: 10 })
    );
  });
});

// ── ensureProfile ─────────────────────────────────────────────────────────────
describe('authService.ensureProfile', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns existing profile role without creating', async () => {
    vi.mocked(mockPrisma.profile.findUnique).mockResolvedValue({ role: 'admin' } as any);

    const result = await authService.ensureProfile(ADMIN_ID);
    expect(result.role).toBe('admin');
    expect(mockPrisma.profile.create).not.toHaveBeenCalled();
  });

  it('auto-provisions new profile with role=user', async () => {
    vi.mocked(mockPrisma.profile.findUnique).mockResolvedValue(null);
    vi.mocked(mockSupabase.auth.admin.getUserById).mockResolvedValue(mockSupaUser as any);
    vi.mocked(mockPrisma.profile.create).mockResolvedValue(mockProfile as any);

    const result = await authService.ensureProfile(USER_ID);
    expect(result.role).toBe('user');
    expect(mockPrisma.profile.create).toHaveBeenCalledOnce();
  });
});
