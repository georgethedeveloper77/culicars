// apps/api/src/server.ts

import express, { type RequestHandler } from "express";
import cors from "cors";

import * as reportsMod from "./routes/reports";
import * as platesMod from "./routes/plates";
import * as contributionsMod from "./routes/contributions";
import * as ocrMod from "./routes/ocr";

function resolveRouter(mod: any): RequestHandler {
  const r = mod?.default ?? mod?.router ?? mod;
  if (typeof r !== "function") {
    const keys = mod && typeof mod === "object" ? Object.keys(mod) : [];
    throw new Error(
      `Route module did not export a router function. Keys: [${keys.join(", ")}]`
    );
  }
  return r;
}

const app = express();

app.use(cors());
app.use(express.json({ limit: "6mb" })); // OCR images can be larger

app.get("/", (_req, res) => {
  res.json({
    ok: true,
    service: "culicars-api",
    time: new Date().toISOString(),
  });
});

app.use("/reports", resolveRouter(reportsMod));
app.use("/plates", resolveRouter(platesMod));
app.use("/contributions", resolveRouter(contributionsMod));
app.use("/ocr", resolveRouter(ocrMod)); // ✅ NEW

const PORT = Number(process.env.PORT || 3000);

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`✅ API running on http://localhost:${PORT}`);
});

export default app;