'use client';
// apps/web/src/app/dashboard/billing/page.tsx

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import {
  getWalletBalance,
  getCreditLedger,
  getPaymentProviders,
  initiatePayment,
  getPaymentStatus,
  PaymentProvider,
} from '@/lib/api';
import { CREDIT_PACKS } from '@/lib/constants';

type LedgerEntry = {
  id: string;
  type: string;
  creditsDelta: number;
  balanceBefore: number;
  balanceAfter: number;
  source: string;
  createdAt: string;
};

type PaymentStep = 'idle' | 'awaiting_mpesa' | 'polling' | 'success' | 'failed';

export default function DashboardBillingPage() {
  const { token } = useAuth();
  const [balance, setBalance] = useState<number | null>(null);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [providers, setProviders] = useState<PaymentProvider[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedPack, setSelectedPack] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<string>('mpesa');
  const [mpesaPhone, setMpesaPhone] = useState('');
  const [payStep, setPayStep] = useState<PaymentStep>('idle');
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [payError, setPayError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    Promise.all([
      getWalletBalance(token),
      getCreditLedger(token),
      getPaymentProviders(),
    ]).then(([bal, led, prov]) => {
      setBalance(bal.balance);
      setLedger(led.entries);
      const enabled = prov.providers.filter(p => p.isEnabled);
      setProviders(enabled);
      if (enabled.length > 0) setSelectedProvider(enabled[0].slug);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  const pack = CREDIT_PACKS.find(p => p.id === selectedPack);

  const handleInitiatePayment = async () => {
    if (!token || !selectedPack || !selectedProvider) return;
    if (selectedProvider === 'mpesa' && !mpesaPhone.trim()) {
      setPayError('Enter your M-Pesa phone number.');
      return;
    }
    setPayError(null);
    setPayStep('awaiting_mpesa');

    try {
      const result = await initiatePayment({
        packId: selectedPack,
        provider: selectedProvider,
        phone: mpesaPhone.trim() || undefined,
      }, token);

      setPaymentId(result.paymentId);
      setPayStep('polling');

      // Poll for status
      let attempts = 0;
      const poll = async () => {
        if (attempts > 30) { setPayStep('failed'); return; }
        attempts++;
        try {
          const status = await getPaymentStatus(result.paymentId, token);
          if (status.status === 'success') {
            setPayStep('success');
            // Refresh balance
            const bal = await getWalletBalance(token);
            setBalance(bal.balance);
          } else if (status.status === 'failed') {
            setPayStep('failed');
          } else {
            setTimeout(poll, 3000);
          }
        } catch {
          setTimeout(poll, 5000);
        }
      };
      setTimeout(poll, 4000);
    } catch (err: unknown) {
      setPayError(err instanceof Error ? err.message : 'Payment initiation failed');
      setPayStep('idle');
    }
  };

  const resetPayment = () => {
    setPayStep('idle');
    setPaymentId(null);
    setPayError(null);
    setSelectedPack(null);
  };

  const LEDGER_TYPE_META: Record<string, { label: string; color: string }> = {
    purchase:     { label: 'Purchase',     color: 'text-emerald-400' },
    spend:        { label: 'Spent',        color: 'text-amber-400' },
    bonus:        { label: 'Bonus',        color: 'text-blue-400' },
    refund:       { label: 'Refund',       color: 'text-emerald-400' },
    admin_grant:  { label: 'Admin grant',  color: 'text-blue-400' },
    admin_deduct: { label: 'Admin deduct', color: 'text-red-400' },
  };

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-cc-text">Credits &amp; Billing</h1>
        {balance !== null && (
          <div className="cc-pill bg-cc-accent/10 border border-cc-accent/30 text-cc-accent font-semibold">
            {balance} credit{balance !== 1 ? 's' : ''} remaining
          </div>
        )}
      </div>

      {/* Buy credits */}
      <div className="cc-card p-6 space-y-5">
        <h2 className="font-semibold text-cc-text">Buy Credits</h2>

        {/* Pack selection */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {CREDIT_PACKS.map(p => (
            <button
              key={p.id}
              onClick={() => setSelectedPack(p.id)}
              className={`relative rounded-xl border p-4 text-center transition-all ${
                selectedPack === p.id
                  ? 'border-cc-accent bg-cc-accent/10'
                  : 'border-cc-border bg-cc-surface-2 hover:border-cc-border-2'
              }`}
            >
              {(p as any).popular && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-cc-accent text-cc-bg text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                  Popular
                </span>
              )}
              <p className="text-2xl font-bold text-cc-text">{p.credits}</p>
              <p className="text-xs text-cc-muted mb-2">credit{p.credits > 1 ? 's' : ''}</p>
              <p className="font-semibold text-cc-accent text-sm">KSh {p.priceKes.toLocaleString()}</p>
              <p className="text-cc-faint text-xs">${p.priceUsd.toFixed(2)}</p>
            </button>
          ))}
        </div>

        {/* Payment provider selection */}
        {selectedPack && (
          <div className="space-y-4 pt-2 border-t border-cc-border">
            <div>
              <p className="cc-label mb-3">Payment method</p>
              <div className="flex flex-wrap gap-2">
                {providers.map(pv => (
                  <button
                    key={pv.slug}
                    onClick={() => setSelectedProvider(pv.slug)}
                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      selectedProvider === pv.slug
                        ? 'border-cc-accent bg-cc-accent/10 text-cc-accent'
                        : 'border-cc-border bg-cc-surface-2 text-cc-muted hover:border-cc-border-2'
                    }`}
                  >
                    {pv.name}
                  </button>
                ))}
                {providers.length === 0 && (
                  <p className="text-cc-muted text-sm">Loading payment methods…</p>
                )}
              </div>
            </div>

            {/* M-Pesa phone */}
            {selectedProvider === 'mpesa' && (
              <div>
                <label className="cc-label">M-Pesa phone number</label>
                <input
                  className="cc-input max-w-xs"
                  value={mpesaPhone}
                  onChange={e => setMpesaPhone(e.target.value)}
                  placeholder="+254 7XX XXX XXX"
                  type="tel"
                />
                <p className="text-cc-faint text-xs mt-1">You'll receive an STK Push to confirm the payment.</p>
              </div>
            )}

            {payError && (
              <p className="text-red-400 text-sm">{payError}</p>
            )}

            {/* Pay button / status */}
            {payStep === 'idle' && (
              <button onClick={handleInitiatePayment} className="cc-btn-primary">
                Pay KSh {pack?.priceKes.toLocaleString()} for {pack?.credits} credit{pack && pack.credits > 1 ? 's' : ''}
              </button>
            )}

            {payStep === 'awaiting_mpesa' && (
              <div className="flex items-center gap-3 text-cc-muted text-sm">
                <svg className="animate-spin h-5 w-5 text-cc-accent" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Sending STK Push to {mpesaPhone}… check your phone.
              </div>
            )}

            {payStep === 'polling' && (
              <div className="flex items-center gap-3 text-cc-muted text-sm">
                <svg className="animate-spin h-5 w-5 text-cc-accent" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Waiting for payment confirmation…
              </div>
            )}

            {payStep === 'success' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 font-medium">
                  <span>✓</span>
                  <span>Payment successful! {pack?.credits} credit{pack && pack.credits > 1 ? 's' : ''} added to your wallet.</span>
                </div>
                <p className="text-cc-text font-bold text-xl">
                  New balance: {balance} credit{balance !== 1 ? 's' : ''}
                </p>
                <button onClick={resetPayment} className="cc-btn-secondary text-sm">
                  Buy more credits
                </button>
              </div>
            )}

            {payStep === 'failed' && (
              <div className="space-y-2">
                <p className="text-red-400 text-sm">Payment failed or timed out. Please try again.</p>
                <button onClick={resetPayment} className="cc-btn-secondary text-sm">Try again</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Transaction history */}
      <div className="cc-card p-6">
        <h2 className="font-semibold text-cc-text mb-4">Transaction History</h2>
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-10 bg-cc-surface-2 rounded animate-pulse" />
            ))}
          </div>
        ) : ledger.length === 0 ? (
          <p className="text-cc-muted text-sm text-center py-6">No transactions yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-cc-border">
                  <th className="text-left text-xs text-cc-muted font-medium pb-2 pr-4">Date</th>
                  <th className="text-left text-xs text-cc-muted font-medium pb-2 pr-4">Type</th>
                  <th className="text-right text-xs text-cc-muted font-medium pb-2 pr-4">Credits</th>
                  <th className="text-right text-xs text-cc-muted font-medium pb-2">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cc-border/50">
                {ledger.map(entry => {
                  const meta = LEDGER_TYPE_META[entry.type] || { label: entry.type, color: 'text-cc-muted' };
                  return (
                    <tr key={entry.id}>
                      <td className="py-2.5 pr-4 text-cc-faint text-xs">
                        {new Date(entry.createdAt).toLocaleDateString('en-KE', {
                          day: 'numeric', month: 'short', year: 'numeric',
                        })}
                      </td>
                      <td className="py-2.5 pr-4">
                        <span className={`text-xs font-medium ${meta.color}`}>{meta.label}</span>
                        {entry.source && (
                          <span className="text-cc-faint text-xs ml-2">· {entry.source}</span>
                        )}
                      </td>
                      <td className={`py-2.5 pr-4 text-right font-mono font-semibold ${
                        entry.creditsDelta > 0 ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        {entry.creditsDelta > 0 ? '+' : ''}{entry.creditsDelta}
                      </td>
                      <td className="py-2.5 text-right font-mono text-cc-muted text-xs">
                        {entry.balanceAfter}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
