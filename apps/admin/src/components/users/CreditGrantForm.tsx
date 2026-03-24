// apps/admin/src/components/users/CreditGrantForm.tsx
'use client';

import { useState } from 'react';
import { Coins } from 'lucide-react';
import { apiPost } from '@/lib/api';

interface CreditGrantFormProps {
  userId: string;
  currentBalance: number;
  onGranted?: (newBalance: number) => void;
}

const QUICK_AMOUNTS = [1, 3, 5, 10];

export function CreditGrantForm({ userId, currentBalance, onGranted }: CreditGrantFormProps) {
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  async function grant() {
    const n = parseInt(amount, 10);
    if (!n || n < 1) return;
    setLoading(true);
    setResult(null);
    try {
      const data = await apiPost<{ balance: number }>('/credits/grant', {
        userId,
        credits: n,
        reason: reason || 'Admin grant',
      });
      setResult({ ok: true, msg: `Granted ${n} credit${n !== 1 ? 's' : ''}. New balance: ${data.balance}` });
      onGranted?.(data.balance);
      setAmount('');
      setReason('');
    } catch (e: unknown) {
      setResult({ ok: false, msg: (e as Error).message ?? 'Failed' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-white/8 bg-[#141414] p-5">
      <div className="flex items-center gap-2 mb-4">
        <Coins className="w-4 h-4 text-[#D4A843]" />
        <h3 className="text-sm font-semibold text-zinc-300">Grant Credits</h3>
      </div>

      <div className="mb-3">
        <p className="text-xs text-zinc-500 mb-1">Current Balance</p>
        <p className="text-2xl font-bold text-[#D4A843]">{currentBalance} credits</p>
      </div>

      {/* Quick amounts */}
      <div className="flex gap-2 mb-4">
        {QUICK_AMOUNTS.map((q) => (
          <button
            key={q}
            onClick={() => setAmount(String(q))}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
              amount === String(q)
                ? 'border-[#D4A843] text-[#D4A843] bg-[#D4A843]/10'
                : 'border-white/10 text-zinc-400 hover:border-white/20 hover:text-zinc-200'
            }`}
          >
            +{q}
          </button>
        ))}
      </div>

      <div className="space-y-3 mb-4">
        <div>
          <label className="block text-xs text-zinc-500 mb-1.5">Credits to Grant</label>
          <input
            type="number"
            min="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount…"
            className="w-full bg-[#0E0E0E] border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-[#D4A843]/50"
          />
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-1.5">Reason (optional)</label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Refund, promo, compensation…"
            className="w-full bg-[#0E0E0E] border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-[#D4A843]/50"
          />
        </div>
      </div>

      {result && (
        <p className={`text-xs mb-3 ${result.ok ? 'text-emerald-400' : 'text-red-400'}`}>
          {result.msg}
        </p>
      )}

      <button
        onClick={grant}
        disabled={!amount || loading}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#D4A843] hover:bg-[#E8C060] text-black text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Coins className="w-4 h-4" />
        {loading ? 'Granting…' : `Grant ${amount || '?'} Credits`}
      </button>
    </div>
  );
}
