// apps/api/src/routes/plates.ts

import { Router } from "express";

const router = Router();

/**
 * Plate -> VIN candidates
 * GET /plates/:plate
 */
router.get("/:plate", (req, res) => {
  const plate = String(req.params.plate || "").trim().toUpperCase();

  res.json({
    plate,
    candidates: [
      {
        vin: "JH4KX12345ABC0001",
        id: "JH4KX12345ABC0001", // id == vin
        plate,
        vehicle: { make: "Toyota", model: "Probox", year: 2017 },
        confidence: 0.86,
      },
    ],
  });
});

export default router;