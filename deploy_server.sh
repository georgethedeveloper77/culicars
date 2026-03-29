#!/bin/bash
# /var/www/vhosts/culicars.com/httpdocs/deploy.sh
# Run this on the SERVER after git pull
# Called automatically by Plesk Git hook or GitHub Actions

set -e
ROOT="/var/www/vhosts/culicars.com/httpdocs"
cd "$ROOT"

echo "[deploy] $(date) — starting"

echo "[deploy] Installing dependencies..."
pnpm install --frozen-lockfile

echo "[deploy] Generating Prisma client..."
pnpm --filter @culicars/database exec prisma generate

echo "[deploy] Building packages..."
pnpm --filter @culicars/types build 2>/dev/null || true
pnpm --filter @culicars/utils build 2>/dev/null || true

echo "[deploy] Building apps..."
pnpm --filter @culicars/api build
pnpm --filter @culicars/web build
pnpm --filter @culicars/admin build

echo "[deploy] Restarting Passenger..."
mkdir -p apps/api/tmp apps/web/tmp apps/admin/tmp
touch apps/api/tmp/restart.txt
touch apps/web/tmp/restart.txt
touch apps/admin/tmp/restart.txt

echo "[deploy] Done ✅"
