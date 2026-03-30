// packages/database/index.ts
export { PrismaClient, Prisma } from '@prisma/client';
export type {
  vehicles as Vehicle,
  plate_vin_map as PlateVinMap,
  reports as Report,
  report_sections as ReportSection,
  report_unlock as ReportUnlock,
  vehicle_events as VehicleEvent,
  stolen_reports as StolenReport,
  wallets as Wallet,
  credit_ledger as CreditLedger,
  payment_providers as PaymentProvider,
  payments as Payment,
  contributions as Contribution,
  cor_consents as CorConsent,
  ocr_scans as OcrScan,
  scraper_jobs as ScraperJob,
  scraper_data_raw as ScraperDataRaw,
  admin_settings as AdminSetting,
} from '@prisma/client';

export { prisma } from './lib/prisma';
