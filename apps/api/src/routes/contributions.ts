// apps/api/src/routes/contributions.ts

import { Router } from "express";

const router = Router();

/**
 * Placeholder route so app.use("/contributions", ...) is valid.
 * Later: payments / unlock purchase etc.
 */
router.get("/", (_req, res) => {
  res.json({
    ok: true,
    message: "Contributions endpoint placeholder.",
  });
});

export default router;