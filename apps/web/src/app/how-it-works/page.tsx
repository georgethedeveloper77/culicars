// apps/web/src/app/how-it-works/page.tsx
import Link from 'next/link';

export default function HowItWorksPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 space-y-16">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-cc-text mb-3">How CuliCars Works</h1>
        <p className="text-cc-muted text-lg">
          Kenya's first vehicle history intelligence platform — built on 13 data sources.
        </p>
      </div>

      {/* Search */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-cc-text flex items-center gap-2">
          <span className="text-2xl">🔍</span> Search by Plate or VIN
        </h2>
        <p className="text-cc-muted leading-relaxed">
          Enter any Kenya number plate (e.g. <span className="font-mono text-cc-text">KCA 123A</span>) or a 17-character VIN.
          We support all Kenya plate formats — standard KXX 000X, government GK, diplomatic CD, UN agencies, and older formats.
        </p>
        <div className="cc-card-2 p-4 font-mono text-sm space-y-1">
          <p className="text-cc-muted">Plate → normalised → plate_vin_map lookup → VIN → full report</p>
          <p className="text-cc-faint text-xs">Confidence scored 0.0–1.0. NTSA COR = 1.0 (highest trust)</p>
        </div>
      </section>

      {/* Stolen check */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-cc-text flex items-center gap-2">
          <span className="text-2xl">🚨</span> Stolen Check — Always Free
        </h2>
        <p className="text-cc-muted leading-relaxed">
          Every single search checks our community stolen reports database by both plate and VIN.
          If an active stolen report exists, a red banner appears immediately — no account, no credits, no exceptions.
          This is a public safety feature.
        </p>
        <div className="bg-red-950/30 border border-red-600/40 rounded-xl p-4 text-sm text-red-400">
          🚨 STOLEN VEHICLE ALERT — This vehicle has been reported stolen on [date] in [county]
        </div>
      </section>

      {/* Report sections */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-cc-text flex items-center gap-2">
          <span className="text-2xl">📋</span> What's in a Report
        </h2>
        <div className="space-y-3">
          {[
            { icon: '🪪', label: 'Identity & Specs', free: true, desc: 'Make, model, year, engine, transmission, VIN decode' },
            { icon: '⚙️', label: 'Specs & Equipment', free: true, desc: 'Full VIN option codes, Japan auction grade if JDM' },
            { icon: '🚨', label: 'Stolen Reports', free: true, desc: 'Community stolen reports database — always visible' },
            { icon: '🔒', label: 'Theft History', free: false, desc: 'Police database checks, past theft, recovery status' },
            { icon: '🚕', label: 'Purpose Check', free: false, desc: 'PSV/matatu, taxi, rental, police, driving school history' },
            { icon: '📏', label: 'Odometer Records', free: false, desc: 'Full mileage history with rollback detection chart' },
            { icon: '⚖️', label: 'Financial & Legal', free: false, desc: 'Logbook loan, hire purchase, NTSA inspection, caveats' },
            { icon: '💥', label: 'Damage Records', free: false, desc: '3D car diagram, location dot, severity, KES cost range' },
            { icon: '🔧', label: 'Service Records', free: false, desc: 'Auto Express Kenya garage visits with mileage' },
            { icon: '📅', label: 'Full Timeline', free: false, desc: 'Every known event — manufactured to present day' },
          ].map(sec => (
            <div key={sec.label} className="cc-card p-4 flex items-start gap-3">
              <span className="text-xl">{sec.icon}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-medium text-cc-text">{sec.label}</span>
                  <span className={`cc-pill text-xs ${sec.free ? 'bg-emerald-500/10 text-emerald-400' : 'bg-cc-surface text-cc-faint'}`}>
                    {sec.free ? 'Free' : '1 credit'}
                  </span>
                </div>
                <p className="text-xs text-cc-muted">{sec.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Data sources */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-cc-text flex items-center gap-2">
          <span className="text-2xl">📡</span> 13 Data Sources
        </h2>
        <p className="text-cc-muted">
          We aggregate from government records, auctions, listing sites, service centres, and community reports.
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            { name: 'NTSA eCitizen', type: 'Government', trust: '1.0' },
            { name: 'KRA iBid Mombasa', type: 'Auction', trust: '0.9' },
            { name: 'BE FORWARD Japan', type: 'Auction sheets', trust: '0.85' },
            { name: 'Auto Express Kenya', type: 'Service records', trust: '0.8' },
            { name: 'Jiji.co.ke', type: 'Listings', trust: '0.5' },
            { name: 'PigiaMe', type: 'Listings', trust: '0.5' },
            { name: 'OLX Kenya', type: 'Listings', trust: '0.5' },
            { name: 'Autochek Africa', type: 'Listings', trust: '0.5' },
            { name: 'Garam Auctions', type: 'Bank repos', trust: '0.75' },
            { name: 'MOGO Auction', type: 'Damaged vehicles', trust: '0.75' },
            { name: 'Car Duka (NCBA)', type: 'Bank auctions', trust: '0.75' },
            { name: 'Community Reports', type: 'Crowd-sourced', trust: '0.4–0.65' },
          ].map(src => (
            <div key={src.name} className="cc-card-2 p-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-cc-text">{src.name}</p>
                <p className="text-xs text-cc-muted">{src.type}</p>
              </div>
              <span className="cc-pill bg-cc-surface text-cc-faint text-xs">Trust {src.trust}</span>
            </div>
          ))}
        </div>
      </section>

      {/* NTSA */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-cc-text flex items-center gap-2">
          <span className="text-2xl">🏛️</span> NTSA COR Auto-Fetch
        </h2>
        <p className="text-cc-muted leading-relaxed">
          The Official Certificate of Registration from NTSA is the highest-trust data source (confidence 1.0).
          CuliCars cannot scrape NTSA directly — instead, you voluntarily open eCitizen in your browser,
          pay KSh 550 to NTSA, and the PDF is intercepted automatically. No upload button required.
        </p>
        <div className="cc-card-2 p-4 text-sm text-cc-muted space-y-1">
          <p>🔒 Owner name, ID, and address are <strong className="text-cc-text">discarded immediately</strong> — never stored.</p>
          <p>✓ Only vehicle data is retained: plate, VIN, inspection status, caveat.</p>
        </div>
      </section>

      <div className="text-center pt-4">
        <Link href="/" className="cc-btn-primary text-base px-8 py-3">
          Search a vehicle →
        </Link>
      </div>
    </div>
  );
}
