// apps/api/src/routes/reports.ts

import { Router } from "express";
import type { ReportResponse, ReportTab, ReportSection } from "../types";
import { store } from "../store";

const router = Router();

function maskVin(vin: string) {
  const v = vin.trim();
  if (v.length <= 8) return v.replace(/.(?=.{2})/g, "*");
  return `${v.slice(0, 4)}${"*".repeat(Math.max(0, v.length - 8))}${v.slice(-4)}`;
}

function buildTabs(args: {
  accessLevel: "locked" | "unlocked";
  sections: Record<string, any>;
}): ReportTab[] {
  const { accessLevel, sections } = args;
  const locked = accessLevel === "locked";

  const photosCount =
    sections?.photos?.preview?.count ??
    sections?.photos?.full?.count ??
    sections?.photos?.preview?.photos?.length ??
    sections?.photos?.full?.photos?.length;

  const mileageCount =
    sections?.mileage?.preview?.count ??
    sections?.mileage?.full?.count ??
    sections?.mileage?.preview?.records?.length ??
    sections?.mileage?.full?.records?.length;

  const damageCount =
    sections?.damage?.preview?.count ??
    sections?.damage?.full?.count ??
    sections?.damage?.preview?.items?.length ??
    sections?.damage?.full?.items?.length;

  const timelineCount =
    sections?.timeline?.preview?.count ??
    sections?.timeline?.full?.count ??
    sections?.timeline?.preview?.events?.length ??
    sections?.timeline?.full?.events?.length;

  return [
    { key: "overview", title: "Overview", locked: false, available: true },
    { key: "photos", title: "Photos", locked, count: photosCount, available: true },
    { key: "purpose", title: "Commercial use check", locked: false, available: true },
    { key: "theft", title: "Theft", locked: false, available: true },
    { key: "mileage", title: "Mileage", locked, count: mileageCount, available: true },
    { key: "legal", title: "Legal status check", locked: true, available: false },
    { key: "title", title: "Title check", locked: true, available: false },
    { key: "damage", title: "Damage", locked, count: damageCount, available: true },
    { key: "timeline", title: "Timeline", locked: false, count: timelineCount, available: true },
  ];
}

function decorateSections(args: {
  accessLevel: "locked" | "unlocked";
  vehicleTitle: string;
  sections: Record<string, any>;
}): Record<string, ReportSection> {
  const { accessLevel, vehicleTitle } = args;
  const input = args.sections ?? {};
  const locked = accessLevel === "locked";

  const out: Record<string, ReportSection> = {};

  out.photos = {
    key: "photos",
    preview: input.photos?.preview ?? { count: 0, photos: [] },
    full: locked ? undefined : input.photos?.full,
    banner: {
      tone: locked ? "info" : "info",
      title: locked ? "Preview" : "Photos",
      message: locked
        ? `Some photos may exist for ${vehicleTitle}. Unlock to view full gallery.`
        : `Photos gallery for ${vehicleTitle}.`,
    },
    insights: [
      {
        title: "CuliCars Insight",
        message: "Auction/import photos can reveal prior damage, repaints, or trim changes.",
      },
    ],
  };

  out.mileage = {
    key: "mileage",
    preview: input.mileage?.preview ?? { records: [], count: 0 },
    full: locked ? undefined : input.mileage?.full,
    banner: {
      tone: locked ? "warning" : "success",
      title: locked ? "Attention" : "Good news",
      message: locked
        ? "Mileage history is available but locked. Unlock to see records and checks."
        : "Mileage records loaded. Review for inconsistencies and rollbacks.",
    },
    insights: [
      {
        title: "CuliCars Insight",
        message: "Sudden mileage drops can suggest rollback or cluster replacement.",
      },
    ],
  };

  out.damage = {
    key: "damage",
    preview: input.damage?.preview ?? { items: [], count: 0 },
    full: locked ? undefined : input.damage?.full,
    banner: {
      tone: locked ? "warning" : "info",
      title: locked ? "Attention" : "Damage check",
      message: locked
        ? "Damage details may exist. Unlock to view incidents, estimates, and severity."
        : "Damage section loaded. Review severity and any structural notes.",
    },
    insights: [
      {
        title: "CuliCars Insight",
        message: "Severe damage can leave structural issues—inspect alignment and tyre wear.",
      },
    ],
  };

  out.timeline = {
    key: "timeline",
    preview: input.timeline?.preview ?? { events: [], count: 0 },
    full: input.timeline?.full,
    banner: {
      tone: "success",
      title: "Good news",
      message: "Timeline helps you understand the vehicle story across years and owners.",
    },
  };

  out.theft = {
    key: "theft",
    preview: input.theft?.preview ?? { found: false, message: "No theft records found." },
    full: input.theft?.full,
    banner: { tone: "success", title: "Good news", message: "No theft records found in checked sources." },
  };

  out.purpose = {
    key: "purpose",
    preview: input.purpose?.preview ?? { usage: "Unknown", notes: "Limited records." },
    full: input.purpose?.full,
    banner: { tone: "info", title: "Usage check", message: "Commercial use can increase wear. Review usage hints." },
  };

  // Keep extras
  for (const key of Object.keys(input)) {
    if (!out[key]) {
      out[key] = { key, preview: input[key]?.preview, full: locked ? undefined : input[key]?.full };
    }
  }

  return out;
}

// ✅ VIN route
router.get("/:vin", (req, res) => {
  const vin = String(req.params.vin || "").trim().toUpperCase();

  // If missing, create a shell (CarVertical-like behavior while enriching)
  const raw = store.getReportByVin(vin) ?? store.createReportShell(vin);

  const vehicle = raw.vehicle ?? {};
  const make = (vehicle.make ?? "").toString().trim();
  const model = (vehicle.model ?? "").toString().trim();
  const year = vehicle.year ?? "";
  const vehicleTitle = [make, model].filter(Boolean).join(" ").trim() || "Vehicle";

  const accessLevel = (raw.accessLevel ?? "locked") as "locked" | "unlocked";

  const header = {
    title: vehicleTitle,
    heroImageUrl: raw.sections?.photos?.preview?.heroImageUrl ?? null,
    chips: [
      { label: "VIN", value: maskVin(vin), masked: true },
      { label: "Fuel", value: String(vehicle.fuel ?? "Unknown") },
      { label: "Year", value: String(year || "Unknown") },
      { label: "Transmission", value: String(vehicle.transmission ?? "Unknown") },
    ],
  };

  const sectionsDecorated = decorateSections({
    accessLevel,
    vehicleTitle,
    sections: raw.sections ?? {},
  });

  const tabs = buildTabs({ accessLevel, sections: sectionsDecorated });

  const response: ReportResponse = {
    id: vin,
    accessLevel,
    vehicle: {
      vin,
      make: vehicle.make ?? null,
      model: vehicle.model ?? null,
      year: vehicle.year ?? null,
      plate: vehicle.plate ?? null,
      fuel: vehicle.fuel ?? null,
      transmission: vehicle.transmission ?? null,
    },
    dataSources: raw.dataSources ?? { sourcesChecked: 0, countriesChecked: 0 },
    header,
    tabs,
    summaryTiles: raw.summaryTiles ?? [],
    sections: sectionsDecorated,
  };

  res.json(response);
});

export default router;