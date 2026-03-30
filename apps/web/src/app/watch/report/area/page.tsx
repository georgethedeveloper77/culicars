'use client';
// apps/web/src/app/watch/report/area/page.tsx

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type AreaAlertType = 'vandalism' | 'parts_theft' | 'suspicious_activity' | 'hijack';

const TYPE_OPTIONS: { value: AreaAlertType; label: string; desc: string; emoji: string }[] = [
  { value: 'vandalism', label: 'Vandalism', desc: 'Property damage in a specific area', emoji: '⚠️' },
  { value: 'parts_theft', label: 'Parts theft', desc: 'Tyres, catalytic converters, mirrors, etc.', emoji: '🔧' },
  { value: 'suspicious_activity', label: 'Suspicious activity', desc: 'Activity that could indicate criminal intent', emoji: '👁️' },
  { value: 'hijack', label: 'Hijack hotspot', desc: 'Area known for vehicle hijacking', emoji: '🔴' },
];

const NAIROBI_AREAS = [
  'Westlands', 'Kilimani', 'Hurlingham', 'Lavington', 'Karen',
  'Langata', 'South B', 'South C', 'Kasarani', 'Ruaka',
  'Githurai', 'Zimmerman', 'Roysambu', 'Thika Road', 'Mombasa Road',
  'Ngong Road', 'Waiyaki Way', 'CBD', 'Industrial Area', 'Eastleigh',
];

export default function ReportAreaPage() {
  const router = useRouter();
  const [type, setType] = useState<AreaAlertType>('suspicious_activity');
  const [locationName, setLocationName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.culicars.com';

  const submit = async () => {
    if (!locationName.trim()) {
      setError('Please specify the area or location.');
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
          locationName: locationName.trim(),
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
          Your area report is under review. Thank you for helping keep your community safer.
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
        <h1 className="text-2xl font-bold text-gray-900 mt-3">Report area activity</h1>
        <p className="text-gray-500 text-sm mt-1">
          Alert the community about criminal activity in a specific area.
          All reports are reviewed before being published.
        </p>
      </div>

      <div className="space-y-5">
        {/* Alert type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Activity type</label>
          <div className="grid grid-cols-2 gap-2">
            {TYPE_OPTIONS.map(opt => (
              <label
                key={opt.value}
                className={`flex flex-col gap-1 p-3 border rounded-xl cursor-pointer transition-colors ${
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
                <span className="text-lg">{opt.emoji}</span>
                <span className="text-xs font-medium text-gray-900">{opt.label}</span>
                <span className="text-xs text-gray-500 leading-tight">{opt.desc}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Area / Location</label>
          <input
            type="text"
            value={locationName}
            onChange={e => setLocationName(e.target.value)}
            placeholder="e.g. Westlands, along Waiyaki Way"
            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            list="nairobi-areas"
          />
          <datalist id="nairobi-areas">
            {NAIROBI_AREAS.map(area => (
              <option key={area} value={area} />
            ))}
          </datalist>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={4}
            placeholder="What happened? When? What vehicles or activity was observed?"
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
          className="w-full bg-gray-900 hover:bg-gray-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
        >
          {submitting ? 'Submitting…' : 'Submit area alert'}
        </button>

        <p className="text-xs text-gray-400 text-center">
          False reports may result in account suspension. Only submit verified information.
        </p>
      </div>
    </main>
  );
}
