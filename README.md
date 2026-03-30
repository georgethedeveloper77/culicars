# T12 — Watch Phase 2: Map + Notifications + Report Integration

## What this thread adds

| Layer | Files |
|---|---|
| SQL | `sql/T12_notifications.sql` — `notifications` + `device_tokens` tables |
| Prisma | `sql/schema_additions.prisma` — models to append to schema.prisma |
| API | `notificationService.ts`, `notifications.ts`, `watchMap.ts`, `watchInsights.ts` |
| Web | `/watch/map/page.tsx`, `WatchMapClient.tsx`, `/watch/insights/page.tsx` |
| Mobile | `watch_screen.dart`, `watch_map_widget.dart`, `notification_service.dart`, `notifications_screen.dart` |
| Report | `communityInsightsBuilder.ts` — replaces T8 placeholder with real Watch data |

---

## Deployment order

### 1. Run SQL
Paste `sql/T12_notifications.sql` into **Supabase SQL Editor** and run.

### 2. Update Prisma schema
Append the models from `sql/schema_additions.prisma` to `packages/database/prisma/schema.prisma`.

Also add to the `User` model:
```prisma
notifications  notification[]
deviceTokens   deviceToken[]
```

Then regenerate the client:
```bash
cd /var/www/vhosts/culicars.com/httpdocs
DATABASE_URL="postgresql://..." DIRECT_DATABASE_URL="postgresql://..." npx prisma generate
```

### 3. Copy API files
```
apps/api/src/services/notificationService.ts
apps/api/src/services/sectionBuilders/communityInsightsBuilder.ts
apps/api/src/routes/notifications.ts
apps/api/src/routes/watchMap.ts
apps/api/src/routes/watchInsights.ts
```

### 4. Patch app.ts
Apply the additions in `apps/api/src/routes/_app_ts_patch.txt` to `apps/api/src/app.ts`:
- Import the three new routers
- Mount: `/notifications`, `/watch/map`, `/watch/insights`

Also patch `apps/api/src/routes/watch.ts` to call `notifyNearbyUsers` after approving an alert (see patch file for exact snippet).

### 5. Set env vars in Plesk (if not already set)
```
FCM_SERVER_KEY=<your Firebase server key>
INTERNAL_API_URL=http://localhost:3001   # or the internal API address
```

### 6. Build and restart API
```bash
cd /var/www/vhosts/culicars.com/httpdocs/apps/api
pnpm build && pm2 restart culicars-api   # or touch restart.txt for Passenger
```

### 7. Copy web files
```
apps/web/src/app/watch/map/page.tsx
apps/web/src/app/watch/map/WatchMapClient.tsx
apps/web/src/app/watch/insights/page.tsx
```

Install Leaflet on web:
```bash
cd apps/web && pnpm add leaflet @types/leaflet
```

Rebuild web:
```bash
pnpm build
```

### 8. Flutter pubspec additions
Add to `apps/mobile/pubspec.yaml`:
```yaml
dependencies:
  flutter_map: ^6.1.0
  latlong2: ^0.9.0
  geolocator: ^11.0.0
  firebase_core: ^2.27.0
  firebase_messaging: ^14.9.0
```

Then:
```bash
cd apps/mobile && flutter pub get
```

Copy Flutter files:
```
apps/mobile/lib/features/watch/watch_screen.dart
apps/mobile/lib/features/watch/watch_map_widget.dart
apps/mobile/lib/features/notifications/notification_service.dart
apps/mobile/lib/features/notifications/notifications_screen.dart
```

Update your GoRouter / bottom nav to use `WatchScreen` (instead of `WatchFeedScreen` directly).

### 9. Wire NotificationService.init() after sign-in
In your auth flow, after a successful login:
```dart
await NotificationService.instance.init(authToken);
```

### 10. Patch communityInsightsBuilder
Replace the stub in `apps/api/src/services/sectionBuilders/communityInsightsBuilder.ts` with the new file from this zip.

---

## Definition of Done verification

- [ ] Map opens first in Watch tab; shows pins for approved alerts
- [ ] Tap pin → bottom sheet appears with alert summary
- [ ] Type filter chips narrow the visible pins
- [ ] Nearby alert approval triggers FCM push notification to users in area
- [ ] Notification appears in in-app inbox (`GET /notifications`)
- [ ] Web `/watch/map` loads with OSM tiles and pins
- [ ] Web `/watch/insights` shows alert type breakdown
- [ ] Report Community Insights section shows real Watch signals (not placeholder)
- [ ] `POST /notifications/register-device` stores token in DB
- [ ] `PATCH /notifications/:id/read` marks single notification read
- [ ] `POST /notifications/read-all` clears unread badge

---

## Notes

- **FCM**: If `FCM_SERVER_KEY` is not set, push delivery is silently skipped — DB notifications still record.
- **Leaflet**: Loaded via `dynamic import` with `ssr: false` to avoid Next.js SSR crash.
- **flutter_map**: Uses OpenStreetMap tiles (free, no API key needed).
- **Nearby user fan-out**: Current implementation uses `user_vehicles` table. A future upgrade can add `preferred_lat`/`preferred_lng` to `User` for users without registered vehicles.
- **communityInsightsBuilder**: Calls the internal API over HTTP. If you want to avoid the network hop, import `watchAlertService` directly — the HTTP approach keeps the section builders decoupled.
