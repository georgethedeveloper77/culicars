#!/bin/bash
# CuliCars Production Deploy Script
# Run this on the SERVER via Plesk SSH terminal or as a post-deployment hook
# Plesk handles the git pull — this script handles the build.
# Usage: bash deploy.sh

set -e  # Exit immediately on any error

echo "🚀 CuliCars Deploy Starting..."
echo "================================"

# ── 1. Navigate to project root ───────────────────────────────────────────────
cd /var/www/vhosts/culicars.com/httpdocs

# ── 2. Install dependencies ───────────────────────────────────────────────────
echo "📦 Installing dependencies..."
pnpm install --frozen-lockfile
echo "✅ Dependencies installed"

# ── 3. Generate Prisma client ─────────────────────────────────────────────────
echo "🔧 Generating Prisma client..."
pnpm --filter @culicars/database exec prisma generate
echo "✅ Prisma client generated"

# ── 4. Build API ──────────────────────────────────────────────────────────────
echo "🔨 Building API..."
pnpm --filter @culicars/api build
echo "✅ API built"

# ── 5. Build Web ──────────────────────────────────────────────────────────────
echo "🔨 Building Web (culicars.com)..."
pnpm --filter @culicars/web build
echo "✅ Web built"

# ── 6. Build Admin ────────────────────────────────────────────────────────────
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