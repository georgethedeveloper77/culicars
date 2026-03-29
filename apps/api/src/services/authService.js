"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = void 0;
// apps/api/src/services/authService.ts
const prisma_1 = require("../lib/prisma");
const supabase_1 = require("../config/supabase");
exports.authService = {
    /**
     * Called after first social login.
     * Creates User row if it doesn't exist, then upserts Profile.
     * Safe to call multiple times.
     */
    async completeProfile(userId, input) {
        // Fetch email from Supabase Auth
        const { data: supaUser, error } = await supabase_1.supabaseAdmin.auth.admin.getUserById(userId);
        if (error || !supaUser.user)
            throw new Error('Could not fetch Supabase user');
        const email = supaUser.user.email ?? '';
        const displayName = input.display_name ??
            supaUser.user.user_metadata?.full_name ??
            email.split('@')[0] ??
            'User';
        // Upsert user row (role lives here)
        const user = await prisma_1.prisma.user.upsert({
            where: { id: userId },
            create: { id: userId, email, role: 'user' },
            update: {},
            select: { id: true, email: true, role: true },
        });
        // Upsert profile row (display info)
        const profile = await prisma_1.prisma.profile.upsert({
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
    async getProfile(userId) {
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                role: true,
                createdAt: true,
                profile: {
                    select: {
                        displayName: true,
                        phone: true,
                        avatarUrl: true,
                        county: true,
                    },
                },
                wallet: { select: { balance: true } },
            },
        });
        if (!user)
            return null;
        return {
            id: user.id,
            email: user.email,
            role: user.role,
            display_name: user.profile?.displayName ?? null,
            phone: user.profile?.phone ?? null,
            avatar_url: user.profile?.avatarUrl ?? null,
            county: user.profile?.county ?? null,
            credits: user.wallet?.balance ?? 0,
            created_at: user.createdAt,
        };
    },
    async updateProfile(userId, input) {
        // Ensure user row exists
        const existing = await prisma_1.prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
        if (!existing)
            return this.completeProfile(userId, input);
        // Update profile row
        await prisma_1.prisma.profile.upsert({
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
    async assignRole(userId, role) {
        // employee is not a DB enum value — store as 'user' with a future roles table
        // For now, UserRole enum is: guest | user | admin | dealer
        // Map employee → admin for now, or extend the enum if needed
        const dbRole = role === 'employee' ? 'user' : role;
        return prisma_1.prisma.user.update({
            where: { id: userId },
            data: { role: dbRole },
            select: { id: true, email: true, role: true },
        });
    },
    async listUsers(options) {
        const { page, limit, role } = options;
        const skip = (page - 1) * limit;
        const where = role ? { role: role } : {};
        const [users, total] = await Promise.all([
            prisma_1.prisma.user.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    email: true,
                    role: true,
                    createdAt: true,
                    profile: { select: { displayName: true } },
                    wallet: { select: { balance: true } },
                },
            }),
            prisma_1.prisma.user.count({ where }),
        ]);
        return {
            users: users.map((u) => ({
                id: u.id,
                email: u.email,
                role: u.role,
                display_name: u.profile?.displayName ?? null,
                credits: u.wallet?.balance ?? 0,
                created_at: u.createdAt,
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
    async ensureUser(userId, email) {
        const existing = await prisma_1.prisma.user.findUnique({
            where: { id: userId },
            select: { role: true },
        });
        if (existing)
            return existing;
        const user = await prisma_1.prisma.user.create({
            data: { id: userId, email, role: 'user' },
            select: { role: true },
        });
        return user;
    },
};
