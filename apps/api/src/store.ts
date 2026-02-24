// apps/api/src/store.ts

type AccessLevel = "locked" | "unlocked";

export type AnyReport = {
  id: string; // VIN (primary key)
  vin: string;

  accessLevel: AccessLevel;

  vehicle: {
    vin: string;
    plate?: string;
    make?: string;
    model?: string;
    year?: number;
    fuel?: string;
    transmission?: string;
  };

  dataSources: {
    sourcesChecked: number;
    countriesChecked: number;
    countries?: string[];
  };

  summaryTiles: Array<{
    key: string;
    title: string;
    tone?: "success" | "warning" | "danger" | "info";
    statusLabel?: string;
    message: string;
    locked?: boolean;
  }>;

  sections: Record<string, any>;
};

// ✅ define sections FIRST (so we can reuse without self-referencing)
const demoVin = "JH4KX12345ABC0001";

const demoSections = {
  photos: {
    preview: {
      count: 8,
      photos: [
        { url: "https://picsum.photos/seed/probox1/900/600" },
        { url: "https://picsum.photos/seed/probox2/900/600" },
      ],
      heroImageUrl: "https://picsum.photos/seed/probox-hero/1200/800",
    },
    full: {
      count: 8,
      photos: Array.from({ length: 8 }).map((_, i) => ({
        url: `https://picsum.photos/seed/probox-full-${i + 1}/1200/800`,
      })),
    },
  },
  mileage: {
    preview: {
      count: 5,
      records: [
        { date: "2022-03-10", mileageKm: 82000 },
        { date: "2021-06-02", mileageKm: 60000 },
      ],
    },
    full: {
      count: 5,
      records: [
        { date: "2024-07-18", mileageKm: 112000, source: "Inspection" },
        { date: "2023-04-30", mileageKm: 96000, source: "Auction" },
        { date: "2022-03-10", mileageKm: 82000, source: "Service" },
        { date: "2021-06-02", mileageKm: 60000, source: "Auction" },
        { date: "2020-02-14", mileageKm: 42000, source: "Auction" },
      ],
    },
  },
  damage: {
    preview: {
      count: 2,
      items: [
        { title: "Rear bumper repair", severity: "minor" },
        { title: "Left fender repaint", severity: "minor" },
      ],
    },
    full: {
      count: 2,
      items: [
        {
          title: "Rear bumper repair",
          severity: "minor",
          estimatedCostKes: 18000,
          note: "Cosmetic repair noted in auction photos.",
        },
        {
          title: "Left fender repaint",
          severity: "minor",
          estimatedCostKes: 25000,
          note: "Possible repaint. Inspect under direct light.",
        },
      ],
    },
  },
  timeline: {
    preview: {
      count: 2,
      events: [
        { date: "2017-01-01", title: "First registration" },
        { date: "2023-04-30", title: "Auction record" },
      ],
    },
    full: {
      count: 2,
      events: [
        { date: "2017-01-01", title: "First registration", detail: "Japan" },
        { date: "2023-04-30", title: "Auction record", detail: "Grade 4" },
      ],
    },
  },
  theft: {
    preview: { found: false, message: "No theft records found." },
    full: { found: false, message: "No theft records found." },
  },
  purpose: {
    preview: { usage: "Mixed", notes: "Some fleet-like indicators." },
    full: { usage: "Mixed", notes: "Possible fleet usage based on listings/records." },
  },
};

const lockedReport: AnyReport = {
  id: demoVin,
  vin: demoVin,
  accessLevel: "locked",
  vehicle: {
    vin: demoVin,
    plate: "KDG 271X",
    make: "Toyota",
    model: "Probox",
    year: 2017,
    fuel: "Petrol",
    transmission: "Auto",
  },
  dataSources: { sourcesChecked: 14, countriesChecked: 3, countries: ["JP", "KE", "AE"] },
  summaryTiles: [
    {
      key: "mileage",
      title: "Mileage",
      tone: "warning",
      statusLabel: "Attention",
      message: "Mileage history available (locked).",
      locked: true,
    },
    {
      key: "damage",
      title: "Damage",
      tone: "info",
      statusLabel: "Preview",
      message: "Possible incidents found (locked).",
      locked: true,
    },
    {
      key: "theft",
      title: "Theft",
      tone: "success",
      statusLabel: "Good news",
      message: "No theft records found.",
    },
    {
      key: "purpose",
      title: "Commercial use",
      tone: "info",
      statusLabel: "Check",
      message: "Usage hints available.",
    },
  ],
  sections: demoSections,
};

const unlockedReport: AnyReport = {
  ...lockedReport,
  accessLevel: "unlocked",
  summaryTiles: [
    {
      key: "mileage",
      title: "Mileage",
      tone: "success",
      statusLabel: "Good news",
      message: "Mileage records look consistent.",
    },
    {
      key: "damage",
      title: "Damage",
      tone: "info",
      statusLabel: "Review",
      message: "Minor cosmetic repairs recorded.",
    },
    {
      key: "theft",
      title: "Theft",
      tone: "success",
      statusLabel: "Good news",
      message: "No theft records found.",
    },
    {
      key: "purpose",
      title: "Commercial use",
      tone: "info",
      statusLabel: "Check",
      message: "Usage hints available.",
    },
  ],
};

// ✅ VIN-keyed store
const reportsByVin: Record<string, AnyReport> = {
  [demoVin]: lockedReport,
  // optional dev shortcut if you want a second route:
  // (not used by VIN routing, but useful for direct debugging)
  [`${demoVin}_UNLOCKED`]: unlockedReport,
};

export const store = {
  getReportByVin(vin: string) {
    const key = vin.trim().toUpperCase();
    return reportsByVin[key] ?? null;
  },

  createReportShell(vin: string) {
    const key = vin.trim().toUpperCase();
    if (reportsByVin[key]) return reportsByVin[key];

    const shell: AnyReport = {
      id: key,
      vin: key,
      accessLevel: "locked",
      vehicle: { vin: key },
      dataSources: { sourcesChecked: 0, countriesChecked: 0, countries: [] },
      summaryTiles: [],
      sections: {
        photos: { preview: { count: 0, photos: [] } },
        mileage: { preview: { count: 0, records: [] } },
        damage: { preview: { count: 0, items: [] } },
        timeline: { preview: { count: 0, events: [] } },
        theft: { preview: { found: false, message: "No records yet." } },
        purpose: { preview: { usage: "Unknown", notes: "No records yet." } },
      },
    };

    reportsByVin[key] = shell;
    return shell;
  },
};