// ============================================================
// CuliCars — Thread 6: Payment Provider Service
// ============================================================
// Admin toggles providers on/off. API returns only enabled ones.
// Orchestrates: initiate → provider.initiate → create payment
//               webhook → verify → grant credits
// ============================================================

import prisma from '../lib/prisma';
import { getPackById, getPackPrice, type CreditPack } from '../config/creditPacks';
import { appendTransaction as grantCredits } from './creditService';
import type {
  ProviderSlug,
  PaymentProviderAdapter,
  InitiatePaymentInput,
  InitiatePaymentResult,
  PaymentStatus,
} from '../types/payment.types';

// Provider adapters — registered at startup
const adapters = new Map<ProviderSlug, PaymentProviderAdapter>();

/**
 * Register a provider adapter. Called once at server startup.
 */
export function registerProvider(adapter: PaymentProviderAdapter) {
  adapters.set(adapter.slug, adapter);
}

/**
 * Get all enabled payment providers from the DB.
 * Only returns providers that are both DB-enabled AND have a registered adapter.
 */
export async function getEnabledProviders() {
  const providers = await prisma.payment_providers.findMany({
    where: { is_enabled: true },
    select: {
      id: true,
      name: true,
      slug: true,
      is_enabled: true,
    },
    orderBy: { name: 'asc' },
  });

  // Only return providers that actually have an adapter registered
  return providers.filter((p) => adapters.has(p.slug as ProviderSlug));
}

/**
 * Check if a specific provider is enabled.
 */
export async function isProviderEnabled(slug: ProviderSlug): Promise<boolean> {
  const provider = await prisma.payment_providers.findUnique({
    where: { slug },
    select: { is_enabled: true },
  });
  return provider?.is_enabled === true && adapters.has(slug);
}

/**
 * Initiate a payment. Creates a pending payment record and calls the provider.
 */
export async function initiatePayment(
  input: InitiatePaymentInput
): Promise<InitiatePaymentResult> {
  const { user_id: userId, packId, provider, phone, returnUrl, cancelUrl } = input;

  // 1. Validate pack exists
  const pack = getPackById(packId);
  if (!pack) {
    throw new Error(`Invalid pack: ${packId}`);
  }

  // 2. Check provider is enabled
  const enabled = await isProviderEnabled(provider);
  if (!enabled) {
    throw new Error(`Payment provider '${provider}' is not available`);
  }

  // 3. Get adapter
  const adapter = adapters.get(provider);
  if (!adapter) {
    throw new Error(`No adapter registered for '${provider}'`);
  }

  // 4. Get price in correct currency for provider
  //    M-Pesa/Card → KES | PayPal/Stripe/RevenueCat → USD
  const { amount, currency } = getPackPrice(pack, provider);

  // 5. Create pending payment record
  const payment = await prisma.payments.create({
    data: {
      user_id: userId,
      provider,
      amount: Math.round(amount * 100), // store in smallest unit (cents/centimes)
      currency,
      credits: pack.credits,
      status: 'pending',
    },
  });

  // 6. Call provider to initiate
  try {
    const result = await adapter.initiate({
      paymentId: payment.id,
      amount,
      currency,
      credits: pack.credits,
      packId,
      userId,
      phone,
      returnUrl,
      cancelUrl,
    });

    // 7. Update payment with provider reference
    await prisma.payments.update({
      where: { id: payment.id },
      data: {
  providerRef: result.providerRef,
        provider_meta: (result.providerData ?? undefined) as any,
        updated_at: new Date(),
      },
    });

    return {
      paymentId: payment.id,
      provider,
      status: 'pending',
providerRef: result.providerRef,
      providerData: result.providerData,
    };
  } catch (err) {
    // Mark payment as failed if provider initiation fails
    await prisma.payments.update({
      where: { id: payment.id },
      data: { status: 'failed', updated_at: new Date() },
    });
    throw err;
  }
}

/**
 * Confirm a payment after webhook/callback.
 * Idempotent: if providerRef already succeeded, returns early.
 * Grants credits atomically on success.
 */
export async function confirmPayment(
  provider_ref: string,
  providerMeta?: Record<string, unknown>
): Promise<{ paymentId: string; credits: number; newBalance: number } | null> {
  // 1. Find payment by provider_ref (UNIQUE constraint = idempotency)
  const payment = await prisma.payments.findFirst({
    where: { provider_ref: providerRef },
  });

  if (!payment) {
    console.warn(`[PaymentProvider] No payment found for ref: ${providerRef}`);
    return null;
  }

  // 2. Idempotent: already confirmed
  if (payment.status === 'success') {
    console.info(`[PaymentProvider] Payment ${payment.id} already confirmed. Skipping.`);
    return null;
  }

  // 3. Skip if already failed/refunded
  if (payment.status !== 'pending') {
    console.warn(`[PaymentProvider] Payment ${payment.id} status is ${payment.status}. Skipping.`);
    return null;
  }

  // 4. Update payment to success
  await prisma.payments.update({
    where: { id: payment.id },
    data: {
      status: 'success',
      provider_meta: (providerMeta ?? undefined) as any,
      updated_at: new Date(),
    },
  });

  // 5. Grant credits (atomic wallet + ledger)
  const grantResult = await grantCredits({
    user_id: payment.user_id,
    amount: payment.credits,
    type: 'purchase',
    meta: { source: `${payment.provider}_purchase`, paymentId: payment.id, amount: payment.amount, currency: payment.currency },
    providerRef: providerRef,
  });

  return {
    paymentId: payment.id,
    credits: payment.credits,
    newBalance: grantResult?.newBalance ?? 0,
  };
}

/**
 * Mark a payment as failed.
 */
export async function failPayment(
  provider_ref: string,
  reason?: string
): Promise<void> {
  const payment = await prisma.payments.findFirst({
    where: { provider_ref: providerRef },
  });

  if (!payment || payment.status !== 'pending') return;

  await prisma.payments.update({
    where: { id: payment.id },
    data: {
      status: 'failed',
      provider_meta: reason ? { failReason: reason } : undefined,
      updated_at: new Date(),
    },
  });
}

/**
 * Get payment by ID (for status polling).
 */
export async function getPaymentById(paymentId: string) {
  return prisma.payments.findUnique({
    where: { id: paymentId },
    select: {
      id: true,
      provider: true,
      amount: true,
      currency: true,
      credits: true,
      status: true,
      provider_ref: true,
      created_at: true,
      updated_at: true,
    },
  });
}

/**
 * Get payment by providerRef.
 */
export async function getPaymentByRef(provider_ref: string) {
  return prisma.payments.findFirst({
    where: { provider_ref: providerRef },
  });
}
