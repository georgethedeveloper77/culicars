// apps/admin/src/components/scraper/ScraperTrigger.tsx
'use client';

import { useState } from 'react';
import { Play, Loader2 } from 'lucide-react';
import { apiPost } from '@/lib/api';
import type { ScraperJob } from '@/types/admin.types';

const SOURCES = [
  'JIJI', 'PIGIAME', 'OLX', 'AUTOCHEK', 'AUTOSKENYA',
  'KABA', 'AUTO_EXPRESS', 'KRA_IBID', 'GARAM', 'MOGO',
  'CAR_DUKA', 'BEFORWARD',
];

interface ScraperTriggerProps {
  onJobCreated?: (job: ScraperJob) => void;
}

export function ScraperTrigger({ onJobCreated }: ScraperTriggerProps) {
  const [source, setSource] = useState(SOURCES[0]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  async function trigger() {
    setLoading(true);
    setResult(null);
    try {
      const job = await apiPost<ScraperJob>('/admin/scraper/run', { source });
      setResult({ ok: true, message: `Job created — ID: ${job.id.slice(0, 8)}…` });
      onJobCreated?.(job);
    } catch (e: unknown) {
      setResult({ ok: false, message: (e as Error).message ?? 'Failed to trigger' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-white/8 bg-[#141414] p-5">
      <h3 className="text-sm font-semibold text-zinc-300 mb-4">Manual Trigger</h3>
      <div className="flex gap-3">
        <select
          value={source}
          onChange={(e) => setSource(e.target.value)}
          className="flex-1 bg-[#0E0E0E] border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-[#D4A843]/50"
        >
          {SOURCES.map((s) => (
            <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
          ))}
        </select>
        <button
          onClick={trigger}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#D4A843] hover:bg-[#E8C060] text-black text-sm font-semibold transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          {loading ? 'Triggering…' : 'Run'}
        </button>
      </div>
      {result && (
        <p className={`mt-3 text-xs ${result.ok ? 'text-emerald-400' : 'text-red-400'}`}>
          {result.message}
        </p>
      )}
    </div>
  );
}
