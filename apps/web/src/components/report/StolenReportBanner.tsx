// apps/web/src/components/report/StolenReportBanner.tsx
import Link from 'next/link';
import { StolenAlert } from '@/lib/api';

interface StolenReportBannerProps {
  alert: StolenAlert;
  plate?: string;
}

export function StolenReportBanner({ alert, plate }: StolenReportBannerProps) {
  if (!alert.active) return null;

  return (
    <div className="relative rounded-xl overflow-hidden border border-red-600/50 bg-gradient-to-r from-red-950/60 to-red-900/30 p-5">
      {/* Pulsing glow */}
      <div className="absolute top-0 left-0 w-1 h-full bg-red-600 rounded-l-xl" />

      <div className="flex items-start gap-4 pl-3">
        {/* Alert icon */}
        <div className="shrink-0 w-10 h-10 rounded-full bg-red-600/20 border border-red-600/40 flex items-center justify-center">
          <span className="text-xl">🚨</span>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-red-400 font-bold text-base mb-0.5">
            STOLEN VEHICLE ALERT
          </h3>
          <p className="text-red-300/80 text-sm">
            This vehicle has been reported stolen
            {alert.date && (
              <> on <span className="font-semibold">{new Date(alert.date).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })}</span></>
            )}
            {alert.county && (
              <> in <span className="font-semibold">{alert.county}</span></>
            )}
            {alert.obNumber && (
              <>. Police OB: <span className="font-mono font-semibold">{alert.obNumber}</span></>
            )}
            .
          </p>

          <div className="flex items-center gap-3 mt-3 flex-wrap">
            <span className="cc-pill bg-red-600/20 text-red-400 border border-red-600/30 text-xs">
              ● Active stolen report
            </span>
            <span className="cc-pill bg-cc-surface text-cc-muted text-xs">
              Free • No credits needed
            </span>
          </div>
        </div>

        {/* Mark recovered CTA if user is on report page */}
        {plate && (
          <Link
            href={`/report-stolen/${plate}?action=recover`}
            className="shrink-0 text-xs text-red-400/70 hover:text-red-400 underline transition-colors hidden sm:block"
          >
            Mark as recovered
          </Link>
        )}
      </div>
    </div>
  );
}
