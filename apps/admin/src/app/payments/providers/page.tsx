// apps/admin/src/app/payments/providers/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { apiGet } from '@/lib/api';
import { PageHeader } from '@/components/ui/PageHeader';
import { ProviderToggle } from '@/components/payments/ProviderToggle';
import { ProviderConfig } from '@/components/payments/ProviderConfig';
import type { PaymentProvider } from '@/types/admin.types';

export default function ProvidersPage() {
  const [providers, setProviders] = useState<PaymentProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    apiGet<PaymentProvider[]>('/payments/providers?all=true')
      .then(setProviders)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  function handleUpdate(updated: PaymentProvider) {
    setProviders((prev) => prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)));
  }

  if (loading) {
    return (
      <div>
        <PageHeader title="Payment Providers" description="Toggle and configure payment methods" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-white/4 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const enabledCount = providers.filter((p) => p.isEnabled).length;

  return (
    <div>
      <PageHeader
        title="Payment Providers"
        description={`${enabledCount} of ${providers.length} providers enabled`}
      />

      <div className="mb-4 p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 text-sm text-amber-300">
        <strong>Note:</strong> M-Pesa is the primary provider for Kenya. PayPal does not accept KES — amounts are converted to USD during processing.
      </div>

      <div className="space-y-2">
        {providers.map((provider) => (
          <div key={provider.id} className="rounded-xl border border-white/8 bg-[#141414] overflow-hidden">
            <ProviderToggle provider={provider} onUpdate={handleUpdate} />

            {/* Expand config */}
            <button
              onClick={() => setExpanded((e) => (e === provider.id ? null : provider.id))}
              className="w-full flex items-center justify-between px-5 py-2.5 text-xs text-zinc-500 hover:text-zinc-300 border-t border-white/6 transition-colors"
            >
              <span>Configuration</span>
              {expanded === provider.id ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>

            {expanded === provider.id && (
              <div className="border-t border-white/6">
                <ProviderConfig provider={provider} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
