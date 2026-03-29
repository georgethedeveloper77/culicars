// packages/database/seed/seed_admin_user.ts
/**
 * Seed: creates admin and employee users in Supabase Auth + users table.
 *
 * Run from monorepo root:
 *   pnpm --filter @culicars/database exec ts-node --project tsconfig.json seed/seed_admin_user.ts
 *
 * Or with npx directly:
 *   cd packages/database
 *   npx ts-node --project tsconfig.json seed/seed_admin_user.ts
 */
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env from monorepo root
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

import { createClient, User as SupabaseUser } from '@supabase/supabase-js';
import { PrismaClient } from '@prisma/client';

const supabaseUrl = process.env.SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const prisma = new PrismaClient();

// NOTE: UserRole enum only has: guest | user | admin | dealer
// employee is a business concept — map it to 'user' role, distinguish by a flag
// or add 'employee' to the enum via a DB migration. For now admin and a note:
const SEED_USERS = [
  {
    email: 'admin@culicars.com',
    password: process.env.SEED_ADMIN_PASSWORD || 'ChangeMe123!',
    displayName: 'CuliCars Admin',
    // UserRole enum: guest | user | admin | dealer
    role: 'admin' as const,
  },
  {
    email: 'employee@culicars.com',
    password: process.env.SEED_EMPLOYEE_PASSWORD || 'ChangeMe456!',
    displayName: 'CuliCars Employee',
    role: 'user' as const, // employee maps to user role in current schema
  },
];

async function seedUser(seedUser: (typeof SEED_USERS)[0]) {
  console.log(`\n→ Processing ${seedUser.email}...`);

  // Check if Supabase auth user exists
  const { data: listData } = await supabase.auth.admin.listUsers();
  const existing = (listData?.users ?? []).find((u: SupabaseUser) => u.email === seedUser.email);

  let userId: string;

  if (existing) {
    console.log(`  ✓ Auth user exists: ${existing.id}`);
    userId = existing.id;
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email: seedUser.email,
      password: seedUser.password,
      email_confirm: true,
      user_metadata: { full_name: seedUser.displayName },
    });

    if (error || !data.user) {
      throw new Error(`Failed to create auth user ${seedUser.email}: ${error?.message}`);
    }

    userId = data.user.id;
    console.log(`  ✓ Created auth user: ${userId}`);
  }

  // Upsert user row (role lives on User model)
  await prisma.user.upsert({
    where: { id: userId },
    create: { id: userId, email: seedUser.email, role: seedUser.role },
    update: { role: seedUser.role },
  });

  // Upsert profile row (display info)
  await prisma.profile.upsert({
    where: { userId },
    create: { userId, displayName: seedUser.displayName },
    update: { displayName: seedUser.displayName },
  });

  console.log(`  ✓ User + profile upserted (role: ${seedUser.role})`);
}

async function main() {
  console.log('=== CuliCars Seed: Admin + Employee Users ===\n');
  try {
    for (const user of SEED_USERS) {
      await seedUser(user);
    }

    console.log('\n✅ Seed complete.\n');
    console.log('Users:');
    console.log(`  admin      admin@culicars.com    role=admin`);
    console.log(`  employee   employee@culicars.com  role=user (employee)`);
    console.log('\n⚠️  Change default passwords before production deployment.');
  } catch (err) {
    console.error('\n❌ Seed failed:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
