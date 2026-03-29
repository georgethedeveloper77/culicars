// apps/web/src/app/pricing/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.culicars.com';

interface CreditPack {
  id: string;
  label: string;
  credits: number;
  price_kes: number;
  price_usd: number;
}

type Provider = 'mpesa' | 'stripe';

interface StkPushResponse {
  checkout_request_id: string;
  message: string;
}

export default function PricingPage() {
  const [packs, setPacks] = useState<CreditPack[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<Provider>('mpesa');
  const [selectedPack, setSelectedPack] = useState<string | null>(null);
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [balance, setBalance] = useState<number | null>(null);

  const supabase = createClient();

  useEffect(() => {
    fetchConfig();
    fetchBalance();
  }, []);

  async function fetchConfig() {
    try {
      const [packsRes, providersRes] = await Promise.all([
        fetch(`${API_URL}/payments/packs?platform=web`),
        fetch(`${API_URL}/payments/providers?platform=web`),
      ]);
      const packsData = await packsRes.json();
      const providersData = await providersRes.json();
      setPacks(packsData.packs ?? []);
      const enabledProviders: Provider[] = providersData.providers ?? ['mpesa'];
      setProviders(enabledProviders);
      setSelectedProvider(enabledProviders[0] ?? 'mpesa');
    } catch (err) {
      console.error('Failed to load pricing config', err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchBalance() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch(`${API_URL}/credits/balance`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setBalance(data.balance);
      }
    } catch {
      // Not signed in — balance stays null
    }
  }

  async function handlePurchase() {
    if (!selectedPack) return setMessage({ type: 'error', text: 'Select a credit pack first.' });

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return setMessage({ type: 'error', text: 'Sign in to purchase credits.' });
    }

    setPaying(true);
    setMessage(null);

    try {
      if (selectedProvider === 'mpesa') {
        const normalised = phone.replace(/^0/, '254').replace(/\D/g, '');
        if (!/^254[17]\d{8}$/.test(normalised)) {
          setPaying(false);
          return setMessage({ type: 'error', text: 'Enter a valid Kenyan phone number (e.g. 0712 345 678).' });
        }

        const res = await fetch(`${API_URL}/payments/mpesa/stk-push`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ phone: normalised, pack_id: selectedPack, platform: 'web' }),
        });

        const data: StkPushResponse = await res.json();
        if (!res.ok) throw new Error((data as any).error ?? 'M-Pesa request failed');

        setMessage({
          type: 'success',
          text: `${data.message} Your credits will appear once payment is confirmed.`,
        });
      } else if (selectedProvider === 'stripe') {
        const res = await fetch(`${API_URL}/payments/stripe/create-intent`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ pack_id: selectedPack, platform: 'web' }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'Stripe request failed');

        // In production: load Stripe.js and call stripe.confirmCardPayment(data.client_secret)
        // For this thread, redirect to a hosted Stripe checkout or show a toast.
        setMessage({
          type: 'success',
          text: `Payment intent created. Complete payment with your card to receive ${packs.find(p => p.id === selectedPack)?.credits} credits.`,
        });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message ?? 'Payment failed. Please try again.' });
    } finally {
      setPaying(false);
    }
  }

  const selectedPackData = packs.find(p => p.id === selectedPack);

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white">
      {/* Header */}
      <section className="border-b border-white/10 px-6 py-12 text-center">
        <p className="text-xs tracking-[0.3em] uppercase text-emerald-400 mb-3">CuliCars Credits</p>
        <h1 className="text-4xl font-semibold tracking-tight mb-3">
          Unlock vehicle intelligence
        </h1>
        <p className="text-white/50 text-sm max-w-md mx-auto">
          One credit unlocks a full vehicle report. Credits never expire.
        </p>
        {balance !== null && (
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-white/70">Your balance:</span>
            <span className="font-medium text-white">{balance} credit{balance !== 1 ? 's' : ''}</span>
          </div>
        )}
      </section>

      <div className="max-w-3xl mx-auto px-6 py-12 space-y-10">
        {/* Packs */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-40 rounded-xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : (
          <div>
            <p className="text-xs tracking-widest uppercase text-white/40 mb-4">Select a pack</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {packs.map((pack) => {
                const isSelected = selectedPack === pack.id;
                return (
                  <button
                    key={pack.id}
                    onClick={() => setSelectedPack(pack.id)}
                    className={`
                      relative text-left p-5 rounded-xl border transition-all duration-200
                      ${isSelected
                        ? 'border-emerald-500 bg-emerald-950/40 ring-1 ring-emerald-500/30'
                        : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8'
                      }
                    `}
                  >
                    {isSelected && (
                      <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-emerald-400" />
                    )}
                    <p className="text-xs text-white/40 uppercase tracking-wider mb-1">{pack.label}</p>
                    <p className="text-3xl font-bold text-white mb-1">{pack.credits}</p>
                    <p className="text-xs text-white/40 mb-3">credits</p>
                    <p className="text-sm font-medium text-white">KES {pack.price_kes.toLocaleString()}</p>
                    <p className="text-xs text-white/30">≈ USD {pack.price_usd}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Provider selector */}
        {providers.length > 1 && (
          <div>
            <p className="text-xs tracking-widest uppercase text-white/40 mb-4">Payment method</p>
            <div className="flex gap-3">
              {providers.map((p) => (
                <button
                  key={p}
                  onClick={() => setSelectedProvider(p)}
                  className={`
                    px-5 py-2.5 rounded-lg border text-sm font-medium transition-all
                    ${selectedProvider === p
                      ? 'border-emerald-500 bg-emerald-950/40 text-white'
                      : 'border-white/10 bg-white/5 text-white/50 hover:text-white hover:border-white/20'
                    }
                  `}
                >
                  {p === 'mpesa' ? 'M-Pesa' : 'Card (Stripe)'}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* M-Pesa phone input */}
        {selectedProvider === 'mpesa' && (
          <div>
            <label className="block text-xs tracking-widest uppercase text-white/40 mb-3">
              M-Pesa phone number
            </label>
            <input
              type="tel"
              placeholder="0712 345 678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="
                w-full max-w-xs px-4 py-3 rounded-lg bg-white/5 border border-white/10
                text-white placeholder-white/20 text-sm
                focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20
                transition
              "
            />
            <p className="mt-2 text-xs text-white/30">You'll receive an STK push to approve payment.</p>
          </div>
        )}

        {/* Stripe note */}
        {selectedProvider === 'stripe' && (
          <div className="rounded-lg bg-white/5 border border-white/10 px-5 py-4">
            <p className="text-sm text-white/60">
              Card payment is processed securely via Stripe.
              {selectedPackData && (
                <> Amount: <span className="text-white font-medium">USD {selectedPackData.price_usd}</span></>
              )}
            </p>
          </div>
        )}

        {/* CTA */}
        <div>
          <button
            onClick={handlePurchase}
            disabled={paying || !selectedPack}
            className="
              w-full sm:w-auto px-8 py-3.5 rounded-xl
              bg-emerald-500 hover:bg-emerald-400
              disabled:bg-white/10 disabled:text-white/30 disabled:cursor-not-allowed
              text-black font-semibold text-sm
              transition-all duration-150
            "
          >
            {paying ? 'Processing…' : (
              selectedPackData
                ? `Get ${selectedPackData.credits} credits — KES ${selectedPackData.price_kes.toLocaleString()}`
                : 'Select a pack to continue'
            )}
          </button>
        </div>

        {/* Message */}
        {message && (
          <div className={`
            rounded-xl px-5 py-4 text-sm
            ${message.type === 'success'
              ? 'bg-emerald-950/50 border border-emerald-500/30 text-emerald-300'
              : 'bg-red-950/50 border border-red-500/30 text-red-300'
            }
          `}>
            {message.text}
          </div>
        )}

        {/* What's included */}
        <div className="border-t border-white/10 pt-8">
          <p className="text-xs tracking-widest uppercase text-white/30 mb-6">What you get</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm text-white/50">
            {[
              { label: 'Full vehicle report', detail: 'Identity, ownership history, damage, odometer' },
              { label: 'Watch alerts', detail: 'Stolen, recovered, and area incident history' },
              { label: 'Community intelligence', detail: 'Crowdsourced records and contribution data' },
            ].map((item) => (
              <div key={item.label}>
                <div className="w-6 h-6 rounded-md bg-emerald-500/20 flex items-center justify-center mb-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                </div>
                <p className="text-white font-medium mb-1">{item.label}</p>
                <p className="text-xs leading-relaxed">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
