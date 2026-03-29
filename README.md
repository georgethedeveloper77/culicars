# T9 — Payments + Unlock Flow

## Files in this zip

```
T9_SQL_MIGRATION.sql
apps/api/src/
  services/
    creditService.ts
    paymentConfigService.ts
    providers/
      mpesa.ts
      stripe.ts
  routes/
    payments.ts
    webhooks/
      mpesa.ts
      stripe.ts
  services/__tests__/
    creditService.test.ts
  app.ts.patch-notes.ts        ← read this, do not deploy it
packages/types/src/
  payment.types.ts
apps/web/src/app/pricing/
  page.tsx
```

---

## Deployment steps (in order)

### 1 — Run SQL migration
Paste `T9_SQL_MIGRATION.sql` into the Supabase SQL Editor and run.  
Verify: `credit_transactions` and `report_unlock` tables exist with correct columns.

---

### 2 — Add env vars in Plesk (api.culicars.com Node.js settings)

```
MPESA_CONSUMER_KEY=
MPESA_CONSUMER_SECRET=
MPESA_SHORTCODE=
MPESA_PASSKEY=
MPESA_CALLBACK_URL=https://api.culicars.com/webhooks/mpesa
MPESA_ENV=sandbox          # change to production when going live
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

### 3 — Install new npm deps on server

```bash
cd /var/www/vhosts/culicars.com/httpdocs
pnpm add stripe --filter @culicars/api
```

---

### 4 — Unzip files into monorepo root on Mac

```bash
cd /Users/karani/Documents/Projects/culicars
unzip -n ~/Downloads/t9.zip
```

---

### 5 — Patch app.ts to mount Stripe webhook before express.json()

Read `apps/api/src/app.ts.patch-notes.ts` for the exact insertion order, then apply:

```bash
# Open app.ts and add these imports near the top (after existing imports):
sed -i '' '/^import.*express/a\
import stripeWebhook from '"'"'./routes/webhooks/stripe'"'"';\
import mpesaWebhook from '"'"'./routes/webhooks/mpesa'"'"';\
import paymentsRouter from '"'"'./routes/payments'"'"';' apps/api/src/app.ts
```

Then manually add the route mounts in the correct order (see patch-notes for exact positions).  
**CRITICAL**: `app.use('/webhooks/stripe', express.raw({ type: 'application/json' }), stripeWebhook)` MUST appear before any `app.use(express.json())`.

---

### 6 — Export payment types from packages/types

```bash
# Append to packages/types/src/index.ts
echo "export * from './payment.types';" >> packages/types/src/index.ts
```

---

### 7 — Build and deploy

```bash
git add -A
git commit -m "T9: Payments + Unlock Flow"
git push
```

Wait for GitHub Actions to build. Passenger restart is automatic.

---

### 8 — Run tests

```bash
cd /var/www/vhosts/culicars.com/httpdocs
pnpm --filter @culicars/api test
```

Expected: all `creditService` tests pass.

---

## Definition of Done checklist

- [ ] `GET /payments/packs?platform=web` returns packs from admin config
- [ ] `GET /payments/providers?platform=web` returns only enabled providers
- [ ] M-Pesa STK push initiated → pending transaction recorded in `credit_transactions`
- [ ] M-Pesa webhook confirms payment → status updated to `confirmed`
- [ ] Duplicate M-Pesa webhook → no double credit (idempotent via `provider_ref` UNIQUE)
- [ ] Stripe intent created → `provider_ref = intent_id` recorded as pending
- [ ] Stripe webhook `payment_intent.succeeded` → status confirmed
- [ ] `POST /reports/:id/unlock` with 0 credits → 402 Insufficient credits
- [ ] `POST /reports/:id/unlock` with ≥1 credit → deducted, report_unlock created
- [ ] Second unlock of same report → returns unlocked:true without deducting again
- [ ] `GET /credits/balance` returns current sum of confirmed transactions
- [ ] `/pricing` page loads packs and correct provider buttons
- [ ] Disabling a provider in admin config → removed from `/payments/providers` response immediately

---

## Notes

- **Credit ledger is append-only.** `status` is the only mutable field (pending → confirmed).
- **Stripe webhook MUST mount before `express.json()`** — raw Buffer body required for HMAC.
- **M-Pesa sandbox**: use the Daraja sandbox credentials and test STK push with the simulator at developer.safaricom.co.ke.
- **PayPal** deferred (does not accept KES; frontend conversion needed — scope a future thread).
- **iOS IAP / Android Play Billing** deferred to T12 mobile thread.
