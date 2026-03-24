"use strict";
// ============================================================
// CuliCars — Thread 6: Payment Provider Service
// ============================================================
// Admin toggles providers on/off. API returns only enabled ones.
// Orchestrates: initiate → provider.initiate → create payment
//               webhook → verify → grant credits
// ============================================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerProvider = registerProvider;
exports.getEnabledProviders = getEnabledProviders;
exports.isProviderEnabled = isProviderEnabled;
exports.initiatePayment = initiatePayment;
exports.confirmPayment = confirmPayment;
exports.failPayment = failPayment;
exports.getPaymentById = getPaymentById;
exports.getPaymentByRef = getPaymentByRef;
const prisma_1 = __importDefault(require("../lib/prisma"));
const creditPacks_1 = require("../config/creditPacks");
const creditService_1 = require("./creditService");
// Provider adapters — registered at startup
const adapters = new Map();
/**
 * Register a provider adapter. Called once at server startup.
 */
function registerProvider(adapter) {
    adapters.set(adapter.slug, adapter);
}
/**
 * Get all enabled payment providers from the DB.
 * Only returns providers that are both DB-enabled AND have a registered adapter.
 */
async function getEnabledProviders() {
    const providers = await prisma_1.default.paymentProvider.findMany({
        where: { isEnabled: true },
        select: {
            id: true,
            name: true,
            slug: true,
            isEnabled: true,
        },
        orderBy: { name: 'asc' },
    });
    // Only return providers that actually have an adapter registered
    return providers.filter((p) => adapters.has(p.slug));
}
/**
 * Check if a specific provider is enabled.
 */
async function isProviderEnabled(slug) {
    const provider = await prisma_1.default.paymentProvider.findUnique({
        where: { slug },
        select: { isEnabled: true },
    });
    return provider?.isEnabled === true && adapters.has(slug);
}
/**
 * Initiate a payment. Creates a pending payment record and calls the provider.
 */
async function initiatePayment(input) {
    const { userId, packId, provider, phone, returnUrl, cancelUrl } = input;
    // 1. Validate pack exists
    const pack = (0, creditPacks_1.getPackById)(packId);
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
    const { amount, currency } = (0, creditPacks_1.getPackPrice)(pack, provider);
    // 5. Create pending payment record
    const payment = await prisma_1.default.payment.create({
        data: {
            userId,
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
        await prisma_1.default.payment.update({
            where: { id: payment.id },
            data: {
                providerRef: result.providerRef,
                providerMeta: (result.providerData ?? undefined),
                updatedAt: new Date(),
            },
        });
        return {
            paymentId: payment.id,
            provider,
            status: 'pending',
            providerRef: result.providerRef,
            providerData: result.providerData,
        };
    }
    catch (err) {
        // Mark payment as failed if provider initiation fails
        await prisma_1.default.payment.update({
            where: { id: payment.id },
            data: { status: 'failed', updatedAt: new Date() },
        });
        throw err;
    }
}
/**
 * Confirm a payment after webhook/callback.
 * Idempotent: if providerRef already succeeded, returns early.
 * Grants credits atomically on success.
 */
async function confirmPayment(providerRef, providerMeta) {
    // 1. Find payment by provider_ref (UNIQUE constraint = idempotency)
    const payment = await prisma_1.default.payment.findFirst({
        where: { providerRef },
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
    await prisma_1.default.payment.update({
        where: { id: payment.id },
        data: {
            status: 'success',
            providerMeta: (providerMeta ?? undefined),
            updatedAt: new Date(),
        },
    });
    // 5. Grant credits (atomic wallet + ledger)
    const newBalance = await (0, creditService_1.grantCredits)({
        userId: payment.userId,
        credits: payment.credits,
        type: 'purchase',
        source: `${payment.provider}_purchase`,
        txRef: providerRef,
        metadata: {
            paymentId: payment.id,
            amount: payment.amount,
            currency: payment.currency,
        },
    });
    return {
        paymentId: payment.id,
        credits: payment.credits,
        newBalance,
    };
}
/**
 * Mark a payment as failed.
 */
async function failPayment(providerRef, reason) {
    const payment = await prisma_1.default.payment.findFirst({
        where: { providerRef },
    });
    if (!payment || payment.status !== 'pending')
        return;
    await prisma_1.default.payment.update({
        where: { id: payment.id },
        data: {
            status: 'failed',
            providerMeta: reason ? { failReason: reason } : undefined,
            updatedAt: new Date(),
        },
    });
}
/**
 * Get payment by ID (for status polling).
 */
async function getPaymentById(paymentId) {
    return prisma_1.default.payment.findUnique({
        where: { id: paymentId },
        select: {
            id: true,
            provider: true,
            amount: true,
            currency: true,
            credits: true,
            status: true,
            providerRef: true,
            createdAt: true,
            updatedAt: true,
        },
    });
}
/**
 * Get payment by providerRef.
 */
async function getPaymentByRef(providerRef) {
    return prisma_1.default.payment.findFirst({
        where: { providerRef },
    });
}
