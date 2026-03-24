"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = PricingPage;
// apps/web/src/app/pricing/page.tsx
const link_1 = __importDefault(require("next/link"));
const constants_1 = require("@/lib/constants");
const FREE_FEATURES = [
    'Search by plate or VIN',
    'Stolen vehicle alert (every search)',
    'Vehicle identity & basic specs',
    'VIN decode & option codes',
    'Community stolen reports database',
    'Report stolen vehicles',
];
const PAID_FEATURES = [
    'Theft history (police database checks)',
    'Purpose check (PSV · taxi · rental · school)',
    'Odometer records & rollback detection',
    'Financial & legal status (logbook, caveat)',
    'Damage records with 3D diagram & KES cost',
    'Service records (Auto Express Kenya)',
    'Import & KRA clearance history',
    'Full timeline of vehicle events',
    'Ownership change history',
    'All photos grouped by date',
    'AI recommendation (proceed / caution / avoid)',
];
function PricingPage() {
    return (<div className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-cc-text mb-3">Simple, transparent pricing</h1>
        <p className="text-cc-muted text-lg">
          Search and stolen alerts are always free. Pay only to unlock full report sections.
        </p>
      </div>

      {/* Free vs Paid */}
      <div className="grid md:grid-cols-2 gap-6 mb-14">
        {/* Free */}
        <div className="cc-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">🆓</span>
            <div>
              <h3 className="font-bold text-xl text-cc-text">Always Free</h3>
              <p className="text-cc-muted text-sm">No account needed</p>
            </div>
          </div>
          <ul className="space-y-2.5">
            {FREE_FEATURES.map(f => (<li key={f} className="flex items-start gap-2.5 text-sm">
                <span className="text-emerald-400 mt-0.5 shrink-0">✓</span>
                <span className="text-cc-muted">{f}</span>
              </li>))}
          </ul>
        </div>

        {/* Paid */}
        <div className="cc-card p-6 border-cc-accent/20 bg-gradient-to-b from-cc-accent/5 to-transparent">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">🔓</span>
            <div>
              <h3 className="font-bold text-xl text-cc-text">Full Report</h3>
              <p className="text-cc-muted text-sm">1 credit per report unlock</p>
            </div>
          </div>
          <ul className="space-y-2.5">
            {PAID_FEATURES.map(f => (<li key={f} className="flex items-start gap-2.5 text-sm">
                <span className="text-cc-accent mt-0.5 shrink-0">✓</span>
                <span className="text-cc-muted">{f}</span>
              </li>))}
          </ul>
        </div>
      </div>

      {/* Credit packs */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-cc-text text-center mb-8">Credit Packs</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {constants_1.CREDIT_PACKS.map(pack => (<div key={pack.id} className={`cc-card p-6 flex flex-col items-center text-center relative ${pack.popular ? 'border-cc-accent/40' : ''}`}>
              {pack.popular && (<span className="absolute -top-3 left-1/2 -translate-x-1/2 cc-pill bg-cc-accent text-cc-bg text-xs font-bold px-3 py-1">
                  Most Popular
                </span>)}
              {'dealerPack' in pack && pack.dealerPack && (<span className="absolute -top-3 left-1/2 -translate-x-1/2 cc-pill bg-blue-500 text-white text-xs font-bold px-3 py-1">
                  Dealer Pack
                </span>)}

              <p className="text-4xl font-bold text-cc-text mb-1">{pack.credits}</p>
              <p className="text-cc-muted text-sm mb-4">credit{pack.credits > 1 ? 's' : ''}</p>

              <div className="mb-4">
                <p className="text-xl font-bold text-cc-accent">KSh {pack.priceKes.toLocaleString()}</p>
                <p className="text-cc-faint text-xs mt-0.5">≈ ${pack.priceUsd.toFixed(2)} USD</p>
              </div>

              <p className="text-xs text-cc-muted mb-5">
                KSh {Math.round(pack.priceKes / pack.credits).toLocaleString()} per report
              </p>

              <link_1.default href={`/signup?pack=${pack.id}`} className={`w-full text-center text-sm ${pack.popular ? 'cc-btn-primary' : 'cc-btn-secondary'}`}>
                Get {pack.credits} credit{pack.credits > 1 ? 's' : ''}
              </link_1.default>
            </div>))}
        </div>
      </div>

      {/* Payment methods */}
      <div className="cc-card p-6 text-center">
        <p className="text-cc-muted text-sm mb-4 font-medium">Payment methods accepted</p>
        <div className="flex flex-wrap justify-center gap-4">
          {[
            { name: 'M-Pesa', icon: '📱', note: 'Primary' },
            { name: 'PayPal', icon: '💳', note: 'International' },
            { name: 'Stripe', icon: '💳', note: 'Card' },
            { name: 'Google Pay', icon: '🤖', note: 'Android' },
            { name: 'Apple Pay', icon: '🍎', note: 'iOS' },
        ].map(pm => (<div key={pm.name} className="flex items-center gap-1.5 text-sm text-cc-muted">
              <span>{pm.icon}</span>
              <span>{pm.name}</span>
              {pm.note === 'Primary' && <span className="cc-pill bg-emerald-500/10 text-emerald-400 text-xs">Primary</span>}
            </div>))}
        </div>
        <p className="text-cc-faint text-xs mt-3">M-Pesa STK Push — pay directly from your phone. No card needed.</p>
      </div>

      {/* FAQ */}
      <div className="mt-14">
        <h2 className="text-xl font-bold text-cc-text mb-6">Common Questions</h2>
        <div className="space-y-4">
          {[
            {
                q: 'What does 1 credit unlock?',
                a: '1 credit unlocks the full report for one vehicle — all sections including damage, odometer, legal status, and more.',
            },
            {
                q: 'Do credits expire?',
                a: 'Credits do not expire. Once purchased, they remain in your wallet indefinitely.',
            },
            {
                q: 'Can I pay with M-Pesa?',
                a: 'Yes — M-Pesa is our primary payment method. You\'ll receive an STK Push directly to your phone to confirm the payment.',
            },
            {
                q: 'Is the stolen alert really free?',
                a: 'Yes, always. Stolen vehicle checks are a public safety feature. No account or credits required to see a stolen alert.',
            },
        ].map(faq => (<div key={faq.q} className="cc-card p-5">
              <p className="font-medium text-cc-text mb-1.5">{faq.q}</p>
              <p className="text-cc-muted text-sm">{faq.a}</p>
            </div>))}
        </div>
      </div>
    </div>);
}
