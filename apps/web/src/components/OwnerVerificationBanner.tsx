// apps/web/src/components/OwnerVerificationBanner.tsx
'use client';

import { useRouter } from 'next/navigation';

interface Props {
  plate: string;
  reportId: string;
  ownershipConfidence?: number; // 0.0 – 1.0
  isVerified?: boolean;
}

/**
 * Shows a "Verify official record" CTA when ownership confidence is low
 * or the user has not completed verification.
 * Never shown inline with ownership details — ownership is ONLY shown after verification.
 */
export function OwnerVerificationBanner({ plate, reportId, ownershipConfidence = 0, isVerified = false }: Props) {
  const router = useRouter();

  // Already verified — nothing to show
  if (isVerified) return null;

  // Only show when confidence is below threshold
  const SHOW_THRESHOLD = 0.7;
  if (ownershipConfidence >= SHOW_THRESHOLD) return null;

  function openVerification() {
    router.push(`/verify?plate=${encodeURIComponent(plate)}&returnTo=/report/${reportId}`);
  }

  return (
    <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
          Ownership not confirmed
        </p>
        <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
          Verify the official record to confirm current ownership details.
        </p>
      </div>
      <button
        onClick={openVerification}
        className="shrink-0 text-sm font-medium bg-amber-600 hover:bg-amber-700 text-white rounded-lg px-4 py-2 transition-colors"
      >
        Verify owner
      </button>
    </div>
  );
}
