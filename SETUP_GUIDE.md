# CuliCars — Threads 1, 2 & 3 Setup Guide

## What's in the zip — 55 files

sudo -u culicars.com_tqzgc0ezfqa bash -c "cd /var/www/vhosts/culicars.com/httpdocs && pnpm install --frozen-lockfile && pnpm --filter @culicars/database exec prisma generate && pnpm --filter @culicars/api build && pnpm --filter @culicars/web build && pnpm --filter @culicars/admin build"

### Root (6 files)
- `package.json` — pnpm workspaces + Turborepo
- `pnpm-workspace.yaml` — workspace config
- `turbo.json` — Turborepo pipeline
- `tsconfig.json` — base TypeScript config
- `.env.example` — template (copy to `.env` and fill in)
- `.gitignore`

### Thread 1 — Database (packages/database/) — 19 files
- `prisma/schema.prisma` — full Prisma schema, 17 tables, all enums
- `prisma/migrations/001-011.sql` — 11 raw SQL migrations
- `seed/` — 5 seed files + runner (21 vehicles, 21 plates, events, providers, settings)
- `client.ts` + `index.ts` + `package.json` + `tsconfig.json`

### Thread 2 — API Foundation (apps/api/) — 17 files
- `src/index.ts` — server entry + graceful shutdown
- `src/app.ts` — Express app, all middleware, route mounting
- `src/config/` — env (Zod validated), supabase, cors
- `src/middleware/` — auth, optionalAuth, requireRole, rateLimiter, errorHandler, requestLogger
- `src/lib/` — prisma singleton, supabaseAdmin
- `src/routes/health.ts` — GET /health
- `package.json` + `tsconfig.json`

### Thread 3 — Search (apps/api/src/ + packages/utils/) — 13 files
- `routes/search.ts` — GET /search?q=KCA123A&type=auto|plate|vin
- `services/` — searchService, plateResolver, vinDecoder, fuzzyMatcher, stolenAlertService
- `validators/searchValidator.ts` — Zod schema
- `types/search.types.ts`
- `packages/utils/` — plateNormalizer, vinValidator, index, package.json

---

## Step-by-Step Setup

### Step 1 — Extract into your culicars folder

```bash
cd /Users/karani/Documents/Projects/culicars
unzip culicars-threads-1-2-3.zip -o
```

### Step 2 — Create your .env file

```bash
cp .env.example .env
```

Open `.env` and paste your real values:

```
SUPABASE_URL=https://pqelsdkisaephcislwbv.supabase.co
NEXT_PUBLIC_SUPABASE_URL=https://pqelsdkisaephcislwbv.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your_key_here
SUPABASE_ANON_KEY=your_key_here
SUPABASE_SERVICE_ROLE_KEY=your_secret_here
DATABASE_URL=postgresql://postgres.pqelsdkisaephcislwbv:yourpassword@aws-1-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true
JWT_SECRET=your_jwt_secret
ENCRYPTION_KEY=your_encryption_key
```

Also create a copy for the database package:

```bash
cp .env packages/database/.env
```

### Step 3 — Install all dependencies

```bash
pnpm install
```

### Step 4 — Run the SQL migrations in Supabase

Go to your Supabase Dashboard → SQL Editor. Run each migration file **in order** (001 through 011). Each file is in `packages/database/prisma/migrations/`.

Run them one at a time:
1. Open `001_users_profiles.sql` → paste into SQL Editor → Run
2. Open `002_vehicles_plates.sql` → paste → Run
3. Continue through `011_admin_settings.sql`

### Step 5 — Generate Prisma client

```bash
cd packages/database
npx prisma generate
```

This reads your `schema.prisma` and generates the TypeScript client that all other code imports.

### Step 6 — Introspect (optional — verify schema matches)

```bash
npx prisma db pull
```

This pulls the live schema from Supabase and updates `schema.prisma`. If your migrations ran correctly, it should match what's already there.

### Step 7 — Seed the database

```bash
npx ts-node seed/index.ts
```

You should see:
```
🌱 Seeding CuliCars database...

✅ Seeded 21 vehicles
✅ Seeded 21 plate→VIN mappings
✅ Seeded 20 vehicle events
✅ Seeded 7 payment providers (M-Pesa ON, rest OFF)
✅ Seeded 7 admin settings

🎉 All seeds complete!
```

### Step 8 — Verify in Supabase

Go to Supabase → SQL Editor and run:

```sql
SELECT
  (SELECT COUNT(*) FROM vehicles)          AS vehicles,
  (SELECT COUNT(*) FROM plate_vin_map)     AS plates,
  (SELECT COUNT(*) FROM payment_providers) AS providers,
  (SELECT COUNT(*) FROM admin_settings)    AS settings,
  (SELECT COUNT(*) FROM vehicle_events)    AS events;
```

Expected: `21 | 21 | 7 | 7 | 20`

### Step 9 — Start the API

```bash
cd apps/api
pnpm dev
```

You should see:
```
🚗 CuliCars API running on port 3000
   Environment: development
   Health: http://localhost:3000/health
   Search: http://localhost:3000/search?q=KCA123A
```

### Step 10 — Test endpoints

```bash
# Health check
curl http://localhost:3000/health

# Search by plate
curl "http://localhost:3000/search?q=KCA123A"

# Search by VIN
curl "http://localhost:3000/search?q=JTDBR32E540012345"

# Search with typo (should get fuzzy suggestions)
curl "http://localhost:3000/search?q=KCA124A"

# Government plate format
curl "http://localhost:3000/search?q=GK1234"
```

### Expected search response (KCA 123A):

```json
{
  "success": true,
  "data": {
    "query": "KCA123A",
    "queryType": "plate",
    "normalizedQuery": "KCA123A",
    "candidates": [{
      "vin": "JTDBR32E540012345",
      "plate": "KCA123A",
      "plateDisplay": "KCA 123A",
      "confidence": 0.97,
      "vehicle": {
        "make": "Toyota",
        "model": "Fielder",
        "year": 2014,
        "color": "Silver",
        "japanAuctionGrade": "4"
      },
      "reportId": null,
      "reportStatus": null
    }],
    "stolenAlert": {
      "active": false,
      "reportCount": 0,
      "reports": []
    }
  }
}
```

---

## Troubleshooting

**"Cannot find module '@culicars/database'"**
→ Run `pnpm install` from the root directory, then `cd packages/database && npx prisma generate`

**"Cannot find module '@culicars/utils'"**
→ Run `pnpm install` from the root directory

**"Invalid environment variables"**
→ Make sure `.env` exists in the root AND in `packages/database/`. Check that all values are filled in (no placeholder text).

**"Database disconnected" on /health**
→ Check your `DATABASE_URL` in `.env`. Make sure it ends with `?pgbouncer=true`. Try resetting your Supabase database password and updating the URL.

**Seed fails with "relation does not exist"**
→ You need to run all 11 SQL migrations first (Step 4) before seeding.

---

## What's Next — Thread 4

Thread 4 builds the OCR pipeline + NTSA COR fetch. Start a new chat with this context block:

```
Project: CuliCars | Thread: 4 of 11 — OCR + NTSA COR Fetch
Stack: Express + TypeScript, Google Cloud Vision, Supabase
Depends on: Thread 1 (ocr_scans, cor_consents, vehicles) + Thread 2

Goal: Two OCR flows:
1. Standard — user uploads logbook/dashboard photo → extract plate/VIN
2. NTSA COR — PDF auto-intercepted from WebView → parse full COR
NO upload button for NTSA. PDF URL intercepted automatically.
Owner name/ID NEVER stored — discarded on parse.

Thread 1-3 complete:
- 17 tables live in Supabase, 21 seeded vehicles
- Express API running with auth + search endpoint
- @culicars/database and @culicars/utils workspace packages ready
```
