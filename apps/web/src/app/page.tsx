// apps/web/src/app/page.tsx
import { SearchBar } from '@/components/shared/SearchBar';
import Link from 'next/link';

const RECENT_SEARCHES = [
  { plate: 'KDG 421K', make: 'Toyota', model: 'Fielder', year: 2015 },
  { plate: 'KCX 891M', make: 'Subaru', model: 'Forester', year: 2013 },
  { plate: 'KCT 332N', make: 'Nissan', model: 'X-Trail', year: 2016 },
];

const HOW_IT_WORKS = [
  {
    step: '01',
    icon: '🔍',
    title: 'Search a number plate or VIN',
    desc: 'Enter any Kenya plate (KCA 123A) or 17-character VIN. Stolen status is checked instantly — free.',
  },
  {
    step: '02',
    icon: '📋',
    title: 'See the free preview',
    desc: 'Identity, specs, and stolen status are always visible. No account or credits needed.',
  },
  {
    step: '03',
    icon: '🔓',
    title: 'Unlock the full report',
    desc: 'Buy credits with M-Pesa or card to unlock damage records, odometer history, legal status, and more.',
  },
];

const DATA_SOURCES = [
  { name: 'NTSA eCitizen', type: 'Government', icon: '🏛️' },
  { name: 'KRA iBid', type: 'Auction', icon: '🏷️' },
  { name: 'Auto Express KE', type: 'Service Records', icon: '🔧' },
  { name: 'BE FORWARD Japan', type: 'Auction Sheets', icon: '🇯🇵' },
  { name: 'Jiji · PigiaMe · OLX', type: 'Listings', icon: '📦' },
  { name: 'Community Reports', type: 'Crowd-sourced', icon: '👥' },
];

const STATS = [
  { value: '2M+', label: 'Vehicles indexed' },
  { value: '13', label: 'Active scrapers' },
  { value: '47', label: 'Counties covered' },
  { value: 'Free', label: 'Stolen checks' },
];

export default function HomePage() {
  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden noise-overlay pt-16 pb-20 md:pt-24 md:pb-28">
        {/* Background grid */}
        <div
          className="absolute inset-0 bg-grid-pattern bg-grid-40 pointer-events-none opacity-100"
          aria-hidden
        />
        {/* Radial glow */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at center, rgba(245,166,35,0.08) 0%, transparent 70%)' }}
          aria-hidden
        />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 bg-cc-surface border border-cc-border-2 rounded-full px-4 py-1.5 mb-6">
            <span className="w-2 h-2 rounded-full bg-cc-green animate-pulse-slow" />
            <span className="text-xs text-cc-muted font-medium">Kenya Vehicle History Intelligence</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-cc-text text-balance leading-[1.1]">
            Know the full history<br />
            <span className="gradient-text">before you buy.</span>
          </h1>

          <p className="mt-5 text-cc-muted text-lg max-w-2xl mx-auto text-balance">
            Search any Kenya number plate or VIN. Instant stolen status check — free, always.
            Unlock full damage, odometer, and legal history with credits.
          </p>

          {/* Search */}
          <div className="mt-8 max-w-xl mx-auto">
            <SearchBar size="large" autoFocus />
          </div>

          {/* Quick example plates */}
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <span className="text-xs text-cc-faint mr-1">Try:</span>
            {RECENT_SEARCHES.map(v => (
              <Link
                key={v.plate}
                href={`/search?q=${encodeURIComponent(v.plate)}`}
                className="cc-pill bg-cc-surface border border-cc-border text-cc-muted hover:border-cc-accent/40 hover:text-cc-text transition-colors text-xs"
              >
                <span className="font-mono font-semibold">{v.plate}</span>
                <span className="text-cc-faint ml-1">{v.year} {v.make} {v.model}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats strip ───────────────────────────────────────────────────── */}
      <section className="border-y border-cc-border bg-cc-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            {STATS.map(s => (
              <div key={s.label}>
                <p className="text-2xl font-bold gradient-text">{s.value}</p>
                <p className="text-xs text-cc-muted mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-cc-text">How CuliCars Works</h2>
          <p className="text-cc-muted mt-2">Three steps to a full vehicle history check.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {HOW_IT_WORKS.map(step => (
            <div key={step.step} className="cc-card p-6 relative overflow-hidden group hover:border-cc-accent/30 transition-colors">
              <div className="absolute top-4 right-5 font-mono text-5xl font-bold text-cc-border-2 group-hover:text-cc-border transition-colors">
                {step.step}
              </div>
              <div className="text-3xl mb-3">{step.icon}</div>
              <h3 className="font-semibold text-cc-text mb-2">{step.title}</h3>
              <p className="text-cc-muted text-sm leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Stolen alert CTA ─────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
        <div className="relative rounded-2xl overflow-hidden border border-red-900/40 bg-gradient-to-br from-red-950/40 to-cc-surface p-8 md:p-10">
          <div className="absolute inset-0 bg-grid-pattern bg-grid-40 opacity-30 pointer-events-none" />
          <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">🚨</span>
                <span className="text-xs font-semibold text-red-400 uppercase tracking-wider">Community Safety Feature</span>
              </div>
              <h3 className="text-2xl font-bold text-cc-text">Has your vehicle been stolen?</h3>
              <p className="text-cc-muted mt-2 max-w-lg">
                Report it on CuliCars — free. Every search for that plate will immediately show a red stolen alert.
                No account required. Police OB number adds verification credibility.
              </p>
            </div>
            <Link href="/report-stolen" className="cc-btn-danger shrink-0 whitespace-nowrap">
              Report Stolen Vehicle
            </Link>
          </div>
        </div>
      </section>

      {/* ── Data sources ─────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-20">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-cc-text">13 Data Sources. One Report.</h2>
          <p className="text-cc-muted mt-2 text-sm">We aggregate from government, auctions, listings, and community.</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {DATA_SOURCES.map(src => (
            <div key={src.name} className="cc-card-2 p-4 flex items-center gap-3">
              <span className="text-2xl">{src.icon}</span>
              <div>
                <p className="text-sm font-medium text-cc-text">{src.name}</p>
                <p className="text-xs text-cc-muted">{src.type}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Report section preview ───────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-20">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-cc-text">What's in a Full Report?</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { icon: '🔒', title: 'Theft History', desc: 'Police DB checks + community stolen reports with OB numbers', free: false },
            { icon: '🚕', title: 'Purpose Check', desc: 'PSV/matatu · taxi · rental · police · driving school history', free: false },
            { icon: '📏', title: 'Odometer Records', desc: 'Full mileage history with rollback detection and chart', free: false },
            { icon: '⚖️', title: 'Financial & Legal', desc: 'Logbook loans · hire purchase · NTSA inspection · caveats', free: false },
            { icon: '💥', title: 'Damage Records', desc: '3D car diagram with damage location, severity, and KES cost range', free: false },
            { icon: '⚙️', title: 'Specs & Equipment', desc: 'Full VIN decode · option codes · Japan auction grade', free: true },
          ].map(item => (
            <div key={item.title} className="cc-card p-5 flex gap-4">
              <span className="text-2xl">{item.icon}</span>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-cc-text text-sm">{item.title}</h4>
                  {item.free && (
                    <span className="cc-pill bg-emerald-500/10 text-emerald-400 text-xs">Free</span>
                  )}
                </div>
                <p className="text-cc-muted text-xs leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="text-center mt-8">
          <Link href="/pricing" className="cc-btn-secondary">View Pricing →</Link>
        </div>
      </section>
    </>
  );
}
