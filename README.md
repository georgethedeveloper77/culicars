# T10 — My Vehicles + Watchlist

## Overview
- `user_vehicles` table with RLS
- Preferred location columns on `Profile`
- `GET/POST/PATCH/DELETE /user/vehicles`
- `GET/POST /user/vehicles/preferred-location`
- Web dashboard `/dashboard`
- Flutter `MyVehiclesScreen`

---

## Deployment Steps

### 1. Run SQL (Supabase SQL Editor)
Copy-paste `sql/t10_user_vehicles.sql` into the Supabase SQL Editor and run.

---

### 2. Upload API files to server

```bash
# From monorepo root on Mac:
scp apps/api/src/services/userVehiclesService.ts \
    root@culicars.com:/var/www/vhosts/culicars.com/httpdocs/apps/api/src/services/

scp apps/api/src/routes/userVehicles.ts \
    root@culicars.com:/var/www/vhosts/culicars.com/httpdocs/apps/api/src/routes/

scp apps/api/src/services/__tests__/userVehiclesService.test.ts \
    root@culicars.com:/var/www/vhosts/culicars.com/httpdocs/apps/api/src/services/__tests__/
```

---

### 3. Register route in app.ts (on server)

```bash
# Add import
sed -i "s|import contributionsRouter|import userVehiclesRouter from './routes/userVehicles';\nimport contributionsRouter|" \
  /var/www/vhosts/culicars.com/httpdocs/apps/api/src/app.ts

# Add route mount (after contributions or before 404 handler)
sed -i "s|app.use('/contributions'|app.use('/user/vehicles', userVehiclesRouter);\napp.use('/contributions'|" \
  /var/www/vhosts/culicars.com/httpdocs/apps/api/src/app.ts
```

If the `sed` lines don't match exactly (contributions route named differently), manually add to `app.ts`:
```ts
import userVehiclesRouter from './routes/userVehicles';
// ...
app.use('/user/vehicles', userVehiclesRouter);
```

---

### 4. Build API

```bash
ssh root@culicars.com
cd /var/www/vhosts/culicars.com/httpdocs
pnpm --filter @culicars/api build
# Restart via Plesk Node.js panel or:
touch apps/api/tmp/restart.txt
```

---

### 5. Run tests

```bash
ssh root@culicars.com
cd /var/www/vhosts/culicars.com/httpdocs
pnpm --filter @culicars/api test -- --reporter=verbose userVehiclesService
```

---

### 6. Upload web dashboard

```bash
scp apps/web/src/app/dashboard/page.tsx \
    root@culicars.com:/var/www/vhosts/culicars.com/httpdocs/apps/web/src/app/dashboard/

ssh root@culicars.com
cd /var/www/vhosts/culicars.com/httpdocs
pnpm --filter @culicars/web build
```

---

### 7. Flutter — add MyVehiclesScreen

```bash
scp apps/mobile/lib/features/profile/my_vehicles_screen.dart \
    [your-mac-path]/apps/mobile/lib/features/profile/
```

Wire it into your Profile tab navigator. Minimal addition to the Profile tab:

```dart
// In your profile screen or tab navigator:
import '../profile/my_vehicles_screen.dart';

// Add a ListTile or button:
ListTile(
  leading: const Icon(Icons.directions_car_outlined),
  title: const Text('My Vehicles'),
  trailing: const Icon(Icons.chevron_right),
  onTap: () => context.push('/profile/vehicles'),
)
```

Add route in `app_router.dart`:
```dart
GoRoute(
  path: '/profile/vehicles',
  builder: (_, __) => const MyVehiclesScreen(),
),
```

---

## Definition of Done Checklist

- [ ] SQL ran without errors in Supabase SQL Editor
- [ ] `GET /user/vehicles` returns `{ vehicles: [] }` for a new user (200)
- [ ] `POST /user/vehicles` with `{ plate: "KDA 123A", relationshipType: "owner" }` → 201
- [ ] `DELETE /user/vehicles/:id` removes the vehicle → 200
- [ ] Duplicate add returns 409
- [ ] No plate + no VIN returns 400
- [ ] `POST /user/vehicles/preferred-location` with `{ lat: -1.286, lng: 36.817 }` → 200
- [ ] Web `/dashboard` renders My Vehicles list and Add Vehicle modal
- [ ] Flutter Profile tab navigates to MyVehiclesScreen
- [ ] Add, view, delete all work on Flutter
- [ ] Unauthenticated requests to all routes return 401
- [ ] Vitest: all tests pass
