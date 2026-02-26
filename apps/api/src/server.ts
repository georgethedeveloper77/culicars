// apps/api/src/server.ts

import express, { type Express, type RequestHandler } from "express";
import cors from "cors";

// Import route modules (they might export default/router/etc)
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
  return r as RequestHandler;
}

const app: Express = express();

app.use(cors());
app.use(express.json({ limit: "6mb" })); // OCR payloads can be larger

// Health check
app.get("/", (_req, res) => {
  res.json({
    ok: true,
    service: "culicars-api",
    time: new Date().toISOString(),
  });
});

// Routes
app.use("/reports", resolveRouter(reportsMod));
app.use("/plates", resolveRouter(platesMod));
app.use("/contributions", resolveRouter(contributionsMod));
app.use("/ocr", resolveRouter(ocrMod));

const PORT = Number(process.env.PORT || 3000);

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`✅ API running on http://127.0.0.1:${PORT}`);
});

export default app;