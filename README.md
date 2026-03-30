# T11 — Watch Phase 1: Alerts + Feed + Moderation

## Files in this zip

```
sql/
  T11_watch_alerts.sql          ← Run in Supabase SQL Editor first

api/
  routes/watch.ts               → apps/api/src/routes/watch.ts
  services/watchAlertService.ts → apps/api/src/services/watchAlertService.ts

admin/
  watch/queue/page.tsx          → apps/admin/src/app/watch/queue/page.tsx

web/
  watch/feed/page.tsx           → apps/web/src/app/watch/feed/page.tsx
  watch/report/vehicle/page.tsx → apps/web/src/app/watch/report/vehicle/page.tsx
  watch/report/area/page.tsx    → apps/web/src/app/watch/report/area/page.tsx

mobile/
  watch_feed_screen.dart        → apps/mobile/lib/features/watch/watch_feed_screen.dart
  submit_alert_sheet.dart       → apps/mobile/lib/features/watch/submit_alert_sheet.dart
```

---

## Deployment steps (in order)

### 1. Run SQL migration
Open Supabase SQL Editor → paste `sql/T11_watch_alerts.sql` → Run.

### 2. Mount the watch route in app.ts
Add to `apps/api/src/app.ts`:

```typescript
import watchRouter from './routes/watch';

// After the existing routes:
app.use('/watch', watchRouter);
```

### 3. Copy API files
```
apps/api/src/routes/watch.ts
apps/api/src/services/watchAlertService.ts
```

### 4. Copy admin page
```
apps/admin/src/app/watch/queue/page.tsx
```
Create the directory if it doesn't exist: `apps/admin/src/app/watch/queue/`

### 5. Copy web pages
```
apps/web/src/app/watch/feed/page.tsx
apps/web/src/app/watch/report/vehicle/page.tsx
apps/web/src/app/watch/report/area/page.tsx
```
Create directories as needed.

### 6. Copy Flutter files
```
apps/mobile/lib/features/watch/watch_feed_screen.dart
apps/mobile/lib/features/watch/submit_alert_sheet.dart
```

### 7. Add watch nav link to admin sidebar
Add a "Watch Queue" link pointing to `/watch/queue` in your admin sidebar component.

### 8. Build and deploy
```bash
git add -A
git commit -m "feat: T11 Watch Phase 1 — alerts, feed, moderation queue"
git push
```

---

## Definition of Done checklist

- [ ] Submit alert on web → appears in admin moderation queue at `/watch/queue`
- [ ] Admin/employee approves → alert appears in public feed at `/watch/feed`
- [ ] Admin rejects → alert removed from feed, record retained in DB (status = rejected)
- [ ] Feed filters by alert type work
- [ ] Employee can moderate; cannot archive (admin-only action)
- [ ] Mobile: submit alert via bottom sheet → submitted correctly
- [ ] Mobile: feed displays approved alerts with filter chips

---

## Alert types reference

| Type | Category | Who submits |
|------|----------|-------------|
| stolen_vehicle | vehicle | Anyone |
| recovered_vehicle | vehicle | Anyone |
| damage | vehicle | Anyone |
| vandalism | area | Anyone |
| parts_theft | area | Anyone |
| suspicious_activity | area | Anyone |
| hijack | area | Anyone |

## Moderation states

`pending → approved / rejected / needs_more_info / disputed / archived`

All records are **immutable** — status transitions only, never DELETE.
Employees cannot archive (admin-only). Rejected records are retained for audit.

---

## Notes

- `normalizePlate()` from `@culicars/utils` returns an object — `?.normalized` is extracted defensively
- Public feed route (`GET /watch/alerts`) never exposes VIN, submitted_by, or moderation details
- `GET /watch/admin/queue` is employee+admin only — full details including moderator fields
- The earth_distance extension is used for the spatial index on lat/lng — if it fails, remove that index for now (it's optional for T11)
