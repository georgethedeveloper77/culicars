// apps/api/src/services/authService.ts
import { prisma } from '../lib/prisma';
import { supabaseAdmin } from '../config/supabase';

export interface ProfileInput {
  display_name?: string;
  phone?: string;
}

export interface UpdateProfileInput extends ProfileInput {
  preferred_location_lat?: number;
  preferred_location_lng?: number;
}

export const authService = {
  /**
   * Called after first social login.
   * Creates User row if it doesn't exist, then upserts Profile.
   * Safe to call multiple times.
   */
  async completeProfile(userId: string, input: ProfileInput) {
    // Fetch email from Supabase Auth
    const { data: supaUser, error } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (error || !supaUser.user) throw new Error('Could not fetch Supabase user');

    const email = supaUser.user.email ?? '';
    const displayName =
      input.display_name ??
      supaUser.user.user_metadata?.full_name ??
      email.split('@')[0] ??
      'User';

    // Upsert user row (role lives here)
    const user = await prisma.user.upsert({
      where: { id: userId },
      create: { id: userId, email, role: 'user' },
      update: {},
      select: { id: true, email: true, role: true },
    });

    // Upsert profile row (display info)
    const profile = await prisma.profile.upsert({
      where: { userId },
      create: {
        userId,
        displayName,
        phone: input.phone ?? supaUser.user.phone ?? null,
      },
      update: {
        ...(input.display_name && { displayName: input.display_name }),
        ...(input.phone !== undefined && { phone: input.phone }),
      },
    });

    return { ...user, displayName: profile.displayName, phone: profile.phone };
  },

  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        created_at: true,
        Profile: {
          select: {
            displayName: true,
            phone: true,
            avatarUrl: true,
            county: true,
          },
        },
        wallets: { select: { balance: true } },
      },
    });

    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      display_name: user.Profile?.displayName ?? null,
      phone: user.Profile?.phone ?? null,
      avatar_url: user.Profile?.avatarUrl ?? null,
      county: user.Profile?.county ?? null,
      credits: (user.wallets as any)?.[0]?.balance ?? 0,
      created_at: user.created_at,
    };
  },

  async updateProfile(userId: string, input: UpdateProfileInput) {
    // Ensure user row exists
    const existing = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!existing) return this.completeProfile(userId, input);

    // Update profile row
    await prisma.profile.upsert({
      where: { userId },
      create: {
        userId,
        displayName: input.display_name ?? null,
        phone: input.phone ?? null,
      },
      update: {
        ...(input.display_name !== undefined && { displayName: input.display_name }),
        ...(input.phone !== undefined && { phone: input.phone }),
      },
    });

    return this.getProfile(userId);
  },

  async assignRole(userId: string, role: 'user' | 'admin' | 'employee' | 'dealer') {
    // employee is not a DB enum value — store as 'user' with a future roles table
    // For now, UserRole enum is: guest | user | admin | dealer
    // Map employee → admin for now, or extend the enum if needed
    const dbRole = role === 'employee' ? 'user' : role as 'user' | 'admin' | 'dealer';

    return prisma.user.update({
      where: { id: userId },
      data: { role: dbRole },
      select: { id: true, email: true, role: true },
    });
  },

  async listUsers(options: { page: number; limit: number; role?: string }) {
    const { page, limit, role } = options;
    const skip = (page - 1) * limit;

    const where = role ? { role: role as any } : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          email: true,
          role: true,
          created_at: true,
          Profile: { select: { displayName: true } },
          wallets: { select: { balance: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users: users.map((u) => ({
        id: u.id,
        email: u.email,
        role: u.role,
        display_name: u.Profile?.displayName ?? null,
        credits: (u.wallets as any)?.[0]?.balance ?? 0,
        created_at: u.created_at,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Ensures a user row exists in DB. Called from auth middleware on first hit.
   */
  async ensureUser(userId: string, email: string): Promise<{ role: string }> {
    const existing = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (existing) return existing;

    const user = await prisma.user.create({
      data: { id: userId, email, role: 'user' },
      select: { role: true },
    });
    return user;
  },
};
