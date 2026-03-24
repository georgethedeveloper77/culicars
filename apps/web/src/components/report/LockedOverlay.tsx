'use client';
// apps/web/src/components/report/LockedOverlay.tsx

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { unlockReport } from '@/lib/api';

interface LockedOverlayProps {
  reportId: string;
  onUnlocked?: () => void;
}

export function LockedOverlay({ reportId, onUnlocked }: LockedOverlayProps) {
  return (
    <div className="relative">
      {/* Blurred preview content */}
      <div className="pointer-events-none select-none filter blur-sm opacity-40 px-6 py-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-4 bg-cc-muted/20 rounded mb-2" style={{ width: `${70 + Math.random() * 30}%` }} />
        ))}
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="cc-card p-6 text-center max-w-xs mx-4 shadow-2xl border-cc-accent/20">
          <div className="text-3xl mb-3">🔒</div>
          <h4 className="font-semibold text-cc-text mb-1">Section Locked</h4>
          <p className="text-cc-muted text-xs mb-4">
            Unlock the full report with 1 credit to see this section and all others.
          </p>
          <UnlockCTA reportId={reportId} onUnlocked={onUnlocked} />
          <p className="text-cc-faint text-xs mt-3">1 credit · KSh 150</p>
        </div>
      </div>
    </div>
  );
}

interface UnlockCTAProps {
  reportId: string;
  onUnlocked?: () => void;
  className?: string;
}

export function UnlockCTA({ reportId, onUnlocked, className }: UnlockCTAProps) {
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUnlock = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      await unlockReport(reportId, token);
      onUnlocked?.();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to unlock';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <Link href={`/login?next=/report/${reportId}`} className={`cc-btn-primary w-full ${className}`}>
        Sign in to unlock
      </Link>
    );
  }

  return (
    <div className={className}>
      <button
        onClick={handleUnlock}
        disabled={loading}
        className="cc-btn-primary w-full"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            Unlocking…
          </span>
        ) : 'Unlock Full Report (1 credit)'}
      </button>
      {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
    </div>
  );
}
