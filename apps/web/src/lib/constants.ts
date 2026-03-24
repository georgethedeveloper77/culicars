// apps/web/src/lib/constants.ts

export const KENYA_COUNTIES = [
  'Baringo', 'Bomet', 'Bungoma', 'Busia', 'Elgeyo-Marakwet',
  'Embu', 'Garissa', 'Homa Bay', 'Isiolo', 'Kajiado',
  'Kakamega', 'Kericho', 'Kiambu', 'Kilifi', 'Kirinyaga',
  'Kisii', 'Kisumu', 'Kitui', 'Kwale', 'Laikipia',
  'Lamu', 'Machakos', 'Makueni', 'Mandera', 'Marsabit',
  'Meru', 'Migori', 'Mombasa', 'Murang\'a', 'Nairobi',
  'Nakuru', 'Nandi', 'Narok', 'Nyamira', 'Nyandarua',
  'Nyeri', 'Samburu', 'Siaya', 'Taita-Taveta', 'Tana River',
  'Tharaka-Nithi', 'Trans Nzoia', 'Turkana', 'Uasin Gishu',
  'Vihiga', 'Wajir', 'West Pokot',
] as const;

export const RISK_COLORS = {
  clean: { bg: 'bg-emerald-500', text: 'text-emerald-600', border: 'border-emerald-200', light: 'bg-emerald-50' },
  low: { bg: 'bg-blue-500', text: 'text-blue-600', border: 'border-blue-200', light: 'bg-blue-50' },
  medium: { bg: 'bg-amber-500', text: 'text-amber-600', border: 'border-amber-200', light: 'bg-amber-50' },
  high: { bg: 'bg-orange-500', text: 'text-orange-600', border: 'border-orange-200', light: 'bg-orange-50' },
  critical: { bg: 'bg-red-600', text: 'text-red-600', border: 'border-red-200', light: 'bg-red-50' },
} as const;

export const CREDIT_PACKS = [
  { id: 'culicars_credits_1', credits: 1, priceKes: 150, priceUsd: 1.00, label: '1 Credit' },
  { id: 'culicars_credits_3', credits: 3, priceKes: 400, priceUsd: 3.00, label: '3 Credits' },
  { id: 'culicars_credits_5', credits: 5, priceKes: 600, priceUsd: 5.00, label: '5 Credits', popular: true },
  { id: 'culicars_credits_10', credits: 10, priceKes: 1000, priceUsd: 9.00, label: '10 Credits', dealerPack: true },
] as const;

export const SECTION_META: Record<string, { label: string; icon: string; free: boolean }> = {
  IDENTITY: { label: 'Identity', icon: '🪪', free: true },
  SPECS_EQUIPMENT: { label: 'Specs & Equipment', icon: '⚙️', free: true },
  STOLEN_REPORTS: { label: 'Stolen Status', icon: '🚨', free: true },
  THEFT: { label: 'Theft', icon: '🔒', free: false },
  PURPOSE: { label: 'Purpose', icon: '🚕', free: false },
  ODOMETER: { label: 'Odometer', icon: '📏', free: false },
  LEGAL: { label: 'Financial & Legal', icon: '⚖️', free: false },
  DAMAGE: { label: 'Damage', icon: '💥', free: false },
  IMPORT: { label: 'Import', icon: '🚢', free: false },
  OWNERSHIP: { label: 'Ownership', icon: '👤', free: false },
  SERVICE: { label: 'Service Records', icon: '🔧', free: false },
  PHOTOS: { label: 'Photos', icon: '📷', free: false },
  TIMELINE: { label: 'Timeline', icon: '📅', free: false },
  RECOMMENDATION: { label: 'Recommendation', icon: '✅', free: false },
};

export const COVER_SECTION_CARDS = [
  { key: 'THEFT', label: 'Theft', icon: '🔒' },
  { key: 'PURPOSE', label: 'Purpose', icon: '🚕' },
  { key: 'ODOMETER', label: 'Odometer', icon: '📏' },
  { key: 'LEGAL', label: 'Financial & Legal', icon: '⚖️' },
  { key: 'DAMAGE', label: 'Damage', icon: '💥' },
];

export const formatKes = (n: number) =>
  `KSh ${n.toLocaleString('en-KE')}`;

export const formatPlate = (raw: string): string => {
  const n = raw.replace(/\s/g, '').toUpperCase();
  // KXX 000X → "KCA 123A"
  const m = n.match(/^([A-Z]{2,3})(\d{3})([A-Z]?)$/);
  if (m) return `${m[1]} ${m[2]}${m[3]}`.trim();
  return n;
};
