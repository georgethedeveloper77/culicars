// apps/api/src/app.ts
// T13–T15 route registration additions
//
// Add these imports and route mounts to your existing app.ts.
// Insert after existing route registrations (payments, watch, etc.)
//
// ─── IMPORTS (add to existing imports block) ───────────────────────────────
// import verificationRouter from './routes/verification';
// import contributionsRouter from './routes/contributions';
// import analyticsRouter from './routes/analytics';
//
// ─── ROUTE MOUNTS (add after existing app.use() calls) ─────────────────────
// app.use('/verify', verificationRouter);
// app.use('/contributions', contributionsRouter);
// app.use('/analytics', analyticsRouter);
// app.use('/watch/insights', (_req, res) => res.redirect('/analytics/watch/public'));
//
// ─── FULL REFERENCE: expected route list after T13–T15 ─────────────────────
// app.use('/health',        healthRouter);
// app.use('/auth',          authRouter);
// app.use('/search',        searchRouter);
// app.use('/reports',       reportsRouter);
// app.use('/payments',      paymentsRouter);
// app.use('/credits',       creditsRouter);
// app.use('/watch',         watchRouter);
// app.use('/notifications', notificationsRouter);
// app.use('/user',          userVehiclesRouter);
// app.use('/ocr',           ocrRouter);
// app.use('/admin',         adminRouter);
// app.use('/data-sources',  dataSourcesRouter);
// app.use('/verify',        verificationRouter);        ← T13
// app.use('/contributions', contributionsRouter);       ← T14
// app.use('/analytics',     analyticsRouter);           ← T15

export {};
