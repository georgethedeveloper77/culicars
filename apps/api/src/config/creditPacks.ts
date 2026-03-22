// ============================================================
// CuliCars — Thread 6: Credit Packs Configuration
// ============================================================
// Server-side only. Prices are NEVER sent from the client.
// KES is the primary currency. USD is used for PayPal/Stripe
// international payments only.
// ============================================================

export interface CreditPack {
  id: string;
  credits: number;
  priceKes: number;       // Kenyan Shillings — M-Pesa, Card
  priceUsd: number;       // US Dollars — PayPal, Stripe, RevenueCat
  label: string;
  popular?: boolean;
  tag?: string;
}

export const CREDIT_PACKS: CreditPack[] = [
  {
    id: 'culicars_credits_1',
    credits: 1,
    priceKes: 150,
    priceUsd: 1.00,
    label: '1 Credit',
  },
  {
    id: 'culicars_credits_3',
    credits: 3,
    priceKes: 400,
    priceUsd: 3.00,
    label: '3 Credits',
  },
  {
    id: 'culicars_credits_5',
    credits: 5,
    priceKes: 600,
    priceUsd: 5.00,
    label: '5 Credits',
    popular: true,
  },
  {
    id: 'culicars_credits_10',
    credits: 10,
    priceKes: 1000,
    priceUsd: 9.00,
    label: '10 Credits',
    tag: 'Dealer Pack',
  },
];

/**
 * Look up a credit pack by ID. Returns undefined if not found.
 */
export function getPackById(packId: string): CreditPack | undefined {
  return CREDIT_PACKS.find((p) => p.id === packId);
}

/**
 * Get the price for a pack in the correct currency for the provider.
 * M-Pesa + Card → KES | PayPal + Stripe + RevenueCat → USD
 */
export function getPackPrice(
  pack: CreditPack,
  provider: string
): { amount: number; currency: string } {
  const usdProviders = ['paypal', 'stripe', 'revenuecat'];
  if (usdProviders.includes(provider)) {
    return { amount: pack.priceUsd, currency: 'USD' };
  }
  return { amount: pack.priceKes, currency: 'KES' };
}

/**
 * Format packs for API response (public-facing).
 * Includes both KES and USD so the frontend can display
 * the right price based on the selected provider.
 */
export function formatPacksForResponse() {
  return CREDIT_PACKS.map((p) => ({
    id: p.id,
    credits: p.credits,
    priceKes: p.priceKes,
    priceUsd: p.priceUsd,
    label: p.label,
    popular: p.popular ?? false,
    tag: p.tag ?? null,
  }));
}
