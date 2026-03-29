// packages/types/src/config.types.ts

export type PaymentProvider =
  | 'mpesa'
  | 'stripe'
  | 'paypal'
  | 'apple_iap'
  | 'play_billing'
  | 'card';

export interface WebCreditPack {
  id: string;
  credits: number;
  price_kes: number;
  price_usd: number;
  label?: string;
  popular?: boolean;
}

export interface AppCreditPack {
  id: string;
  credits: number;
  price_usd: number;
  product_id?: string; // App Store / Play Store product identifier
  label?: string;
  popular?: boolean;
}

export interface WebHeroConfig {
  headline: string;
  subtext: string;
}

export interface AppConfig {
  onboarding_title: string;
  onboarding_subtitle: string;
  feature_flags: {
    watch_enabled: boolean;
    contributions_enabled: boolean;
  };
}

export interface WatchSettings {
  approval_mode: 'manual' | 'auto';
  expiry_days: number;
  public_visibility: boolean;
  require_evidence: boolean;
}

// Typed map of all config keys → their value shapes
export interface AdminConfigMap {
  payment_providers_web: PaymentProvider[];
  payment_providers_app: PaymentProvider[];
  credit_packs_web: WebCreditPack[];
  credit_packs_app: AppCreditPack[];
  web_hero: WebHeroConfig;
  app_config: AppConfig;
  watch_settings: WatchSettings;
  ntsa_fetch_enabled: boolean;
  maintenance_mode: boolean;
}

export type AdminConfigKey = keyof AdminConfigMap;

export interface AdminConfigRow {
  key: AdminConfigKey;
  value: AdminConfigMap[AdminConfigKey];
  updated_by: string | null;
  updated_at: string;
}

export * from './config.types';
