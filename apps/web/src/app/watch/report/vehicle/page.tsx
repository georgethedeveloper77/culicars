'use client';
// apps/web/src/app/watch/report/vehicle/page.tsx

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type VehicleAlertType = 'stolen_vehicle' | 'recovered_vehicle' | 'damage';

const TYPE_OPTIONS: { value: VehicleAlertType; label: string; desc: string; emoji: string }[] = [
  { value: 'stolen_vehicle', label: 'Stolen vehicle', desc: 'Report a stolen vehicle', emoji: '🚨' },
  { value: 'recovered_vehicle', label: 'Vehicle recovered', desc: 'Update — a stolen vehicle has been found', emoji: '✅' },
  { value: 'damage', label: 'Vehicle damage', desc: 'Damage caused by accident or vandalism', emoji: '💥' },
];

export default function ReportVehiclePage() {
  const router = useRouter();
  const [type, setType] = useState<VehicleAlertType>('stolen_vehicle');
  const [plate, setPlate] = useState('');
  const [vin, setVin] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.culicars.com';

  const submit = async () => {
    if (!plate && !vin) {
      setError('Please provide a number plate or VIN.');
      return;
    }
    if (description.trim().length < 10) {
      setError('Please provide a description of at least 10 characters.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const token = localStorage.getItem('sb_access_token');
      const res = await fetch(`${API}/watch/alerts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          type,
          plate: plate || undefined,
          vin: vin || undefined,
          description: description.trim(),
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? 'Submission failed');
      setSuccess(true);
    } catch (err: any) {
      setError(err.message ?? 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <main className="max-w-lg mx-auto px-4 py-12 text-center">
        <div className="text-5xl mb-4">🙏</div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Alert submitted</h1>
        <p className="text-gray-500 text-sm mb-6">
          Your report is under review. Approved alerts appear in the public feed.
          Thank you for helping keep Kenya's roads safer.
        </p>
        <button
          onClick={() => router.push('/watch/feed')}
          className="bg-gray-900 text-white text-sm font-semibold px-6 py-3 rounded-xl hover:bg-gray-700 transition-colors"
        >
          Back to Watch feed
        </button>
      </main>
    );
  }

  return (
    <main className="max-w-lg mx-auto px-4 py-8">
      <div className="mb-6">
        <a href="/watch/feed" className="text-sm text-gray-400 hover:text-gray-600">← Watch feed</a>
        <h1 className="text-2xl font-bold text-gray-900 mt-3">Report a vehicle</h1>
        <p className="text-gray-500 text-sm mt-1">
          All reports are reviewed by our moderation team before being published.
        </p>
      </div>

      <div className="space-y-5">
        {/* Alert type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Alert type</label>
          <div className="space-y-2">
            {TYPE_OPTIONS.map(opt => (
              <label
                key={opt.value}
                className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-colors ${
                  type === opt.value
                    ? 'border-gray-900 bg-gray-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="type"
                  value={opt.value}
                  checked={type === opt.value}
                  onChange={() => setType(opt.value)}
                  className="sr-only"
                />
                <span className="text-xl">{opt.emoji}</span>
                <div>
                  <p className="text-sm font-medium text-gray-900">{opt.label}</p>
                  <p className="text-xs text-gray-500">{opt.desc}</p>
                </div>
                {type === opt.value && (
                  <span className="ml-auto text-gray-900 text-sm">✓</span>
                )}
              </label>
            ))}
          </div>
        </div>

        {/* Plate */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Number plate <span className="text-gray-400 font-normal">(recommended)</span>
          </label>
          <input
            type="text"
            value={plate}
            onChange={e => setPlate(e.target.value.toUpperCase())}
            placeholder="KCA 123A"
            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-gray-900 uppercase"
          />
        </div>

        {/* VIN */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            VIN / Chassis <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            type="text"
            value={vin}
            onChange={e => setVin(e.target.value.toUpperCase())}
            placeholder="JTDBT923X71234567"
            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={4}
            placeholder="Where was the vehicle last seen? What happened? Any distinguishing features?"
            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
          />
          <p className="text-xs text-gray-400 mt-1 text-right">{description.length}/1000</p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">{error}</div>
        )}

        <button
          onClick={submit}
          disabled={submitting}
          className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
        >
          {submitting ? 'Submitting…' : 'Submit alert'}
        </button>

        <p className="text-xs text-gray-400 text-center">
          False reports may result in account suspension. Only submit verified information.
        </p>
      </div>
    </main>
  );
}
