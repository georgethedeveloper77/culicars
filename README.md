# T8 — Report System Upgrade

## What this thread adds

- `riskScorer.ts` — risk score (0–100) + level + flags from raw vehicle data
- `sectionBuilders/` — 7 section builders: identity, stolenAlerts, ownership, damage, odometer, timeline, communityInsights
- `reportGenerator.ts` — orchestrates sections, upserts `vehicle_report`, manages `report_access`
- `routes/reports.ts` — GET /reports/by-vin/:vin, GET /reports/:id/preview, POST /reports/:id/unlock, GET /reports/saved
- Web: `apps/web/src/app/report/[id]/page.tsx` — full locked/unlocked report UI
- Mobile: `apps/mobile/lib/features/report/report_full_screen.dart` — full report screen with section cards
- `T8_migrations.sql` — `vehicle_report` + `report_access` tables

---

## Deployment steps (in order)

### 1. Run SQL migration

In Supabase SQL Editor, paste and run `T8_migrations.sql`.

### 2. Deploy files

```bash
# On your Mac — unzip straight into monorepo root
unzip -n culicars-t8.zip -d /Users/karani/Documents/Projects/culicars/
```

### 3. Register reports router in app.ts

Add these two lines after your existing route imports in `apps/api/src/app.ts`:

```ts
import reportsRouter from './routes/reports.js';
app.use('/reports', reportsRouter);
```

### 4. Prisma introspect (picks up new tables)

```bash
DATABASE_URL="postgresql://postgres:[password]@db.pqelsdkisaephcislwbv.supabase.co:5432/postgres" \
DIRECT_DATABASE_URL="postgresql://postgres:[password]@db.pqelsdkisaephcislwbv.supabase.co:5432/postgres" \
  pnpm --filter @culicars/database prisma db pull
```

Then rebuild the database package:

```bash
pnpm --filter @culicars/database build
```

### 5. Build and deploy API

```bash
git add -A && git commit -m "T8: Report system upgrade" && git push
```

Wait for GitHub Actions → Plesk picks up the build.

### 6. Build web

```bash
pnpm --filter web build
```

Or let Plesk/CI handle it after push.

### 7. Build mobile (optional at this stage)

```bash
cd apps/mobile
flutter pub get
flutter build apk --debug
```

---

## Definition of Done verification

| Check | How to verify |
|---|---|
| Partial result renders a premium-looking shell | Search a VIN with only one raw_record — should return state=partial with locked sections visible |
| Report correctly shows locked sections before unlock | GET /reports/:id/preview — sections other than identity and stolenAlerts should have `locked: true` |
| Full content shown after unlock | POST /reports/:id/unlock with a user who has credits — all sections should return full data |
| Community Insights section exists; shows placeholder if no Watch data | Check `sections.communityInsights.available === false` and `placeholder` string present |
| Unlock records access in DB | After unlock, check `report_access` table in Supabase for the row |
| No search returns a blank 200 | Any VIN with zero records returns state=pending_enrichment with PendingShell UI |

---

## Key rules enforced

- Owner PII (name, ID, address) **never stored** — ownership section only surfaces owner count + transfer date
- Credit ledger is **append-only** — unlock writes a `credit_transaction` row, never updates/deletes
- `report_access` has a UNIQUE constraint on `(report_id, user_id)` — idempotent unlock
- Community Insights gracefully empty until T12 Watch data is live
- Language rules: no "no data found", "raw data", "NTSA card" anywhere in UI copy
