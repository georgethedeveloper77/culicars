"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const nanoid_1 = require("nanoid");
const zod_1 = require("zod");
const app = (0, express_1.default)();
app.use((0, cors_1.default)({ origin: true }));
app.use(express_1.default.json({ limit: "1mb" }));
const reportsById = new Map();
const reportIdByVin = new Map();
const plateMatchesByPlate = new Map();
plateMatchesByPlate.set("KDA123A", [
    { vin: "JH4KA8260MC000001", confidence: 0.78, source: "crowd" },
    { vin: "JH4KA8260MC000002", confidence: 0.62, source: "scrape" }
]);
const CreateReportSchema = zod_1.z.object({
    vin: zod_1.z.string().min(5).max(32)
});
const SubmitContributionSchema = zod_1.z.object({
    vin: zod_1.z.string().min(5).max(32),
    plate: zod_1.z.string().min(3).max(16).optional(),
    notes: zod_1.z.string().max(1000).optional(),
    mileageKm: zod_1.z.number().int().min(0).max(5_000_000).optional(),
    condition: zod_1.z
        .object({
        accident: zod_1.z.boolean().optional(),
        flood: zod_1.z.boolean().optional(),
        engine: zod_1.z.enum(["good", "ok", "bad"]).optional()
    })
        .optional(),
    evidenceUrls: zod_1.z.array(zod_1.z.string().url()).max(10).optional(),
    anonId: zod_1.z.string().min(6).max(64)
});
app.get("/health", (_req, res) => {
    res.json({ ok: true });
});
app.post("/reports", (req, res) => {
    const parsed = CreateReportSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ message: "Invalid payload", issues: parsed.error.issues });
    }
    const vin = parsed.data.vin.trim().toUpperCase();
    const existingId = reportIdByVin.get(vin);
    if (existingId) {
        return res.json({ id: existingId });
    }
    const id = (0, nanoid_1.nanoid)(10);
    const now = new Date().toISOString();
    const report = {
        id,
        vin,
        createdAt: now,
        overview: {
            score: 72,
            summary: "Basic overview is available. Unlock for photos/mileage/damage/documents.",
            make: "Toyota",
            model: "Probox",
            year: 2017
        },
        photos: [
            { url: "https://picsum.photos/seed/probox1/800/600", label: "Front" },
            { url: "https://picsum.photos/seed/probox2/800/600", label: "Rear" }
        ],
        mileage: [
            { date: "2023-02-01", km: 110000, source: "service" },
            { date: "2024-10-10", km: 145000, source: "inspection" }
        ],
        timeline: [
            { date: "2017-06-01", title: "First registration", detail: "Imported/registered" },
            { date: "2024-10-10", title: "Inspection record", detail: "Odometer captured" }
        ],
        accessLevel: "locked"
    };
    reportsById.set(id, report);
    reportIdByVin.set(vin, id);
    return res.status(201).json({ id });
});
app.get("/reports/:id", (req, res) => {
    const id = req.params.id;
    const report = reportsById.get(id);
    if (!report) {
        return res.status(404).json({ message: "Report not found" });
    }
    return res.json(report);
});
app.get("/plates/:plate", (req, res) => {
    const plate = req.params.plate.trim().toUpperCase();
    const candidates = plateMatchesByPlate.get(plate) ?? [];
    return res.json({ plate, candidates });
});
app.post("/contributions", (req, res) => {
    const parsed = SubmitContributionSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ message: "Invalid payload", issues: parsed.error.issues });
    }
    const contributionId = (0, nanoid_1.nanoid)(12);
    return res.status(201).json({ contributionId });
});
const PORT = process.env.PORT ? Number(process.env.PORT) : 3002;
app.listen(PORT, () => {
    console.log(`API running on http://localhost:${PORT}`);
});
//# sourceMappingURL=server.js.map