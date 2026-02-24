// apps/api/src/types.ts

export type AccessLevel = "locked" | "unlocked";

export type BannerTone = "success" | "warning" | "danger" | "info";

export type ReportHeaderChip = {
  label: string;
  value: string;
  masked?: boolean;
};

export type ReportHeader = {
  title: string;
  heroImageUrl?: string | null;
  chips: ReportHeaderChip[];
};

export type ReportTab = {
  key: string;
  title: string;
  locked: boolean;
  count?: number;
  available?: boolean; // if false -> show "Coming soon"
};

export type SectionBanner = {
  tone: BannerTone;
  title: string;
  message: string;
};

export type SectionInsight = {
  title: string;
  message: string;
};

export type ReportSection = {
  key: string;

  // For locked tabs, UI can show preview (blurred) and keep full hidden.
  preview?: any;

  // Only returned (or meaningful) when unlocked.
  full?: any;

  // CarVertical-like status banner
  banner?: SectionBanner;

  // Blue info cards
  insights?: SectionInsight[];
};

export type Vehicle = {
  vin?: string | null;
  make?: string | null;
  model?: string | null;
  year?: number | string | null;
  plate?: string | null;

  // optional extras (safe to add even if not always present)
  fuel?: string | null;
  transmission?: string | null;
};

export type DataSources = {
  sourcesChecked: number;
  countriesChecked: number;
  // optional for UI: flags list or country codes, etc
  countries?: string[];
};

export type SummaryTile = {
  key: string;
  title: string;
  tone?: BannerTone; // success/warning/danger/info
  statusLabel?: string; // "Good news" / "Attention"
  message: string; // 1-line message
  locked?: boolean;
};

export type ReportResponse = {
  id: string;
  accessLevel: AccessLevel;

  vehicle: Vehicle;
  dataSources: DataSources;

  // ✅ NEW
  header: ReportHeader;

  // ✅ NEW
  tabs: ReportTab[];

  summaryTiles: SummaryTile[];

  // ✅ sections map, keyed by tab key (photos/mileage/damage/timeline/purpose/theft/etc)
  sections: Record<string, ReportSection>;
};