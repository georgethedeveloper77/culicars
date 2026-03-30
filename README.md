# CuliCars T13–T16 Deploy Guide

Unzip into the monorepo root, then follow the steps below **in order**.
Each thread has its own section. Complete and verify each on production before moving to the next.

```bash
unzip -n t13_to_t16.zip -d /path/to/culicars/
```

---

## Pre-flight (run once before any thread)

```bash
# Add webview_flutter to Flutter pubspec
cd apps/mobile
# Edit pubspec.yaml — add: webview_flutter: ^4.4.4
flutter pub get
cd ../..

# Verify monorepo builds
pnpm build
```

---

## T13 — Official Verification Flow

### 1. SQL — Run in Supabase SQL Editor

Copy-paste the full contents of `sql/t13_t14_tables.sql` into the Supabase SQL Editor and execute.
This creates `vehicle_verification` and `contributions` with RLS.

### 2. Prisma — Sync schema

```bash
cd apps/api
npx prisma@5.22.0 db pull
npx prisma@5.22.0 generate
```

Add the two model blocks from `sql/schema.additions.prisma` to `packages/database/prisma/schema.prisma` if introspection didn't pick them up automatically.

### 3. API — Register new routes

Open `apps/api/src/app.ts` and add:

```typescript
import verificationRouter from './routes/verification';
// ... existing imports

app.use('/verify', verificationRouter);
```

### 4. Build and deploy API

```bash
cd apps/api
pnpm build
# On server:
# pm2 restart api  OR  touch restart.txt for Passenger
```

### 5. Deploy web app

```bash
cd apps/web
pnpm build
# Phusion Passenger restarts automatically on Plesk deploy
```

### 6. Definition of Done — verify on production

- [ ] `POST https://api.culicars.com/verify/initiate` with a plate returns `{ verificationId, alreadyVerified }`
- [ ] `POST /verify/:id/live` returns `{ status: "manual_required" }` when `ntsa_fetch_enabled = false`
- [ ] Upload a real or test COR PDF to `POST /verify/:id/upload` → fields parsed, `status: "completed"` returned
- [ ] `GET /verify/status?plate=KBX123A` returns `{ verified: true }` after completion
- [ ] Visit `https://culicars.com/verify?plate=KBX123A` — full-screen flow renders, no dead ends
- [ ] Report page shows `OwnerVerificationBanner` for vehicles with low ownership confidence
- [ ] Flutter: `OwnerVerificationWidget` renders on report screen; tapping opens full-screen WebView
- [ ] Ownership details are **never** shown before verification completes

---

## T14 — Contribution System

### 1. SQL — already run with T13 (contributions table is in the same migration file)

### 2. API — Register new routes

Open `apps/api/src/app.ts` and add:

```typescript
import contributionsRouter from './routes/contributions';

app.use('/contributions', contributionsRouter);
```

### 3. Build and deploy API + web + admin

```bash
pnpm build
```

### 4. Definition of Done — verify on production

- [ ] `POST /contributions` with `type: "odometer"` and evidence URLs → returns `201` with `status: "pending"`
- [ ] `GET /contributions/pending` (admin auth) → shows queued items
- [ ] `PATCH /contributions/:id/moderate` with `status: "approved"` → record updated, report enriched
- [ ] `PATCH /contributions/:id/moderate` with `status: "rejected"` → record retained in DB (not deleted)
- [ ] Approved contribution does **not** overwrite a raw_record with confidence ≥ 0.8
- [ ] Employee can access `/contributions/pending` but **cannot** reach `/settings/payments`
- [ ] Admin contributions queue page at `https://admin.culicars.com/contributions/queue` renders
- [ ] Web contribute page at `https://culicars.com/report/:id/contribute` renders all 4 contribution types
- [ ] Flutter: `ContributionCardsStrip` renders on report screen; odometer form submits successfully

---

## T15 — Insights + Analytics

### 1. API — Register new routes

Open `apps/api/src/app.ts` and add:

```typescript
import analyticsRouter from './routes/analytics';

app.use('/analytics', analyticsRouter);
// Public watch insights alias:
app.use('/watch/insights', (_req, res) => res.redirect(307, '/analytics/watch/public'));
```

### 2. Build and deploy

```bash
pnpm build
```

### 3. Definition of Done — verify on production

- [ ] `GET /analytics/business` (admin auth) → returns `searchesLast30Days`, `reportsUnlocked`, `conversionRate`, `revenueLast30Days`
- [ ] `GET /analytics/watch` (admin/employee auth) → returns `topHotspots`, `mostReportedModels`, `pendingCount`, `approvalRate`
- [ ] `GET /analytics/watch/public` (no auth) → returns watch data **without** `pendingCount`
- [ ] `GET /analytics/data-jobs` (admin auth) → returns data source health list
- [ ] `https://culicars.com/watch/insights` renders with live aggregated data (or graceful "no data yet" states)
- [ ] `https://admin.culicars.com/analytics` renders sparkbar charts with real data
- [ ] `https://admin.culicars.com/watch/insights` renders hotspots + most reported models + approval rate
- [ ] Public insights page exposes **no** individual records

---

## T16 — Polish + Production QA

No new deployments. Work through the checklist below against production.

### Language / copy audit

Run from monorepo root:

```bash
grep -rn --include="*.tsx" --include="*.ts" --include="*.dart" \
  -e "scraping\|scraped\|scraper\|NTSA card\|no data found\|raw data\|ownership shown by default" \
  apps/web/src apps/admin/src apps/mobile/lib
```

Fix any hits using substitutions in `apps/web/src/lib/copy-audit.ts`.

### Empty state audit

Visit every route listed in `copy-audit.ts` and confirm it has a non-dead-end empty state.

### Dark mode check

```bash
# Web: open Chrome DevTools → Rendering → Emulate CSS prefers-color-scheme: dark
# Flutter: ThemeMode.dark in MaterialApp — run in simulator with dark mode on
```

Confirm all T13–T15 UI components use CSS variables / ColorScheme — no hardcoded hex colors.

### Role access final audit

```bash
# Log in as employee. Attempt to reach:
curl -b <employee_cookie> https://api.culicars.com/settings/payments
# Expect: 403 Forbidden

curl -b <employee_cookie> https://api.culicars.com/analytics/business
# Expect: 403 Forbidden

curl -b <employee_cookie> https://api.culicars.com/contributions/pending
# Expect: 200 OK

curl -b <employee_cookie> https://api.culicars.com/analytics/watch
# Expect: 200 OK
```

### Definition of Done

- [ ] Zero hits from the grep audit above
- [ ] Every route handles loading, empty, and error states
- [ ] Dark mode consistent across web, admin, and mobile (no hardcoded colours in T13–T15 code)
- [ ] Employee cannot reach any destructive or payment config route
- [ ] No ownership details shown before verification on any surface
- [ ] Language rules enforced: no "scraping", "NTSA card", "no data found", "raw data" anywhere in UI

---

## Carry-forward TS errors (non-blocking)

These pre-existed before T13 and are suppressed by `noEmitOnError: false` in `tsconfig.json`:

- `userVehicles.ts`: `requireAuth` → `auth` rename
- `walletService`/`ledgerService`: `tx.wallet` → `tx.wallets`
- `packages/database/index.ts`: prisma export path
- `mpesa`/`stripe`: missing type declarations
- All `TS7006` implicit-any in `sectionBuilders`

Do not fix these mid-session. Track for a dedicated cleanup pass.
