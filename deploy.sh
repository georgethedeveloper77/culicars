#!/bin/bash
# CuliCars Production Deploy Script
# Run this on the SERVER via Plesk SSH terminal or as a post-deployment hook
# Plesk handles the git pull — this script handles the build.
# Usage: bash deploy.sh

set -e

REPO=/var/www/vhosts/culicars.com/httpdocs
DB_URL="postgresql://postgres.pqelsdkisaephcislwbv:2030culicars2030@aws-1-eu-central-1.pooler.supabase.com:5432/postgres"

echo "🚀 CuliCars Deploy Starting..."
echo "================================"

# ── 1. Navigate to project root ───────────────────────────────────────────────
cd "$REPO"

# ── 2. Install dependencies ───────────────────────────────────────────────────
echo "📦 Installing dependencies..."
pnpm install --frozen-lockfile
echo "✅ Dependencies installed"

# ── 3. Introspect DB → pull any new tables into schema.prisma ─────────────────
echo "🔍 Introspecting database schema..."
DATABASE_URL="$DB_URL" \
DIRECT_DATABASE_URL="$DB_URL" \
  npx prisma@5.22.0 db pull --schema=packages/database/prisma/schema.prisma
echo "✅ Schema up to date"

# ── 4. Generate Prisma client ─────────────────────────────────────────────────
echo "🔧 Generating Prisma client..."
pnpm --filter @culicars/database exec prisma generate
echo "✅ Prisma client generated"

# ── 5. Build packages (types + utils) ────────────────────────────────────────
echo "🔨 Building packages..."
pnpm --filter @culicars/types build
pnpm --filter @culicars/utils build
echo "✅ Packages built"

# ── 6. Build API ──────────────────────────────────────────────────────────────
echo "🔨 Building API..."
pnpm --filter @culicars/api build
echo "✅ API built"

# ── 7. Build Web ──────────────────────────────────────────────────────────────
echo "🔨 Building Web (culicars.com)..."
pnpm --filter @culicars/web build
echo "✅ Web built"

# ── 8. Build Admin ────────────────────────────────────────────────────────────
echo "🔨 Building Admin (admin.culicars.com)..."
pnpm --filter @culicars/admin build
echo "✅ Admin built"

echo ""
echo "================================"
echo "✅ Deploy complete!"
echo ""
echo "👉 Now restart all three apps in Plesk:"
echo "   - api.culicars.com   → Restart App"
echo "   - culicars.com       → Restart App"
echo "   - admin.culicars.com → Restart App"
echo ""
echo "👉 Then verify:"
echo "   curl https://api.culicars.com/health"