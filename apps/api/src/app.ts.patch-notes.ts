// apps/api/src/app.ts  ← PATCH — add these lines in the correct order
//
// CRITICAL ORDER in app.ts:
//
//   import express from 'express';
//   import stripeWebhook from './routes/webhooks/stripe';
//   import mpesaWebhook from './routes/webhooks/mpesa';
//   import paymentsRouter from './routes/payments';
//
//   const app = express();
//
//   // ① Stripe webhook FIRST — needs raw Buffer body, before express.json()
//   app.use('/webhooks/stripe', express.raw({ type: 'application/json' }), stripeWebhook);
//
//   // ② M-Pesa webhook — standard JSON is fine
//   app.use('/webhooks/mpesa', express.json(), mpesaWebhook);
//
//   // ③ express.json() for all other routes
//   app.use(express.json());
//
//   // ④ Payments + credits routes
//   app.use('/payments', paymentsRouter);
//   app.use('/credits', paymentsRouter);   // /credits/balance served from same router
//
// See README.md for the full sed commands to patch app.ts on the server.
