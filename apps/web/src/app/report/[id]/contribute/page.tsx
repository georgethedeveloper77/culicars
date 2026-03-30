// apps/web/src/app/report/[id]/contribute/page.tsx
'use client';

import { Suspense, useState } from 'react';
import { useRouter } from 'next/navigation';

type ContributionType = 'odometer' | 'service_record' | 'damage' | 'listing_photo';

interface Props {
  params: { id: string };
}

const TYPE_LABELS: Record<ContributionType, string> = {
  odometer: 'Odometer reading',
  service_record: 'Service record',
  damage: 'Damage evidence',
  listing_photo: 'Listing / photo',
};

const TYPE_DESCRIPTIONS: Record<ContributionType, string> = {
  odometer: 'Record a mileage reading with date and photo evidence.',
  service_record: 'Log a service visit with garage, mileage, and work summary.',
  damage: 'Document damage with date, location, and photos.',
  listing_photo: 'Share a listing screenshot or vehicle photos.',
};

function ContributePageInner({ params }: Props) {
  const router = useRouter();
  const reportId = params.id;
  const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.culicars.com';

  const [selectedType, setSelectedType] = useState<ContributionType | null>(null);
  const [step, setStep] = useState<'select' | 'form' | 'submitting' | 'done' | 'error'>('select');
  const [errorMsg, setErrorMsg] = useState('');

  // Form state
  const [plate, setPlate] = useState('');
  const [odometerValue, setOdometerValue] = useState('');
  const [odometerDate, setOdometerDate] = useState('');
  const [serviceName, setServiceName] = useState('');
  const [serviceDate, setServiceDate] = useState('');
  const [serviceMileage, setServiceMileage] = useState('');
  const [serviceSummary, setServiceSummary] = useState('');
  const [damageDate, setDamageDate] = useState('');
  const [damageLocation, setDamageLocation] = useState('');
  const [files, setFiles] = useState<File[]>([]);

  async function uploadEvidence(fileList: File[]): Promise<string[]> {
    // In production, upload to Supabase Storage and return URLs.
    // Placeholder returns empty array — evidence upload wired in T16 polish.
    return [];
  }

  async function submit() {
    if (!selectedType || !plate) return;
    setStep('submitting');

    try {
      const evidenceUrls = await uploadEvidence(files);

      let data: Record<string, any> = {};
      if (selectedType === 'odometer') {
        data = { value: Number(odometerValue), unit: 'km', dateObserved: odometerDate };
      } else if (selectedType === 'service_record') {
        data = {
          date: serviceDate,
          garageName: serviceName,
          mileage: Number(serviceMileage),
          workSummary: serviceSummary,
        };
      } else if (selectedType === 'damage') {
        data = { date: damageDate, location: damageLocation };
      }

      const res = await fetch(`${API}/contributions`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plate: plate.toUpperCase(),
          type: selectedType,
          data,
          evidenceUrls,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? 'Submission failed');
      }

      setStep('done');
    } catch (e: any) {
      setErrorMsg(e.message ?? 'Something went wrong');
      setStep('error');
    }
  }

  if (step === 'done') {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-4 bg-background">
        <div className="w-full max-w-lg text-center space-y-4">
          <div className="h-12 w-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
            <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-foreground">Contribution submitted</h2>
          <p className="text-sm text-muted-foreground">
            Your contribution is under review. It will appear on the report once approved.
          </p>
          <button
            onClick={() => router.push(`/report/${reportId}`)}
            className="w-full bg-primary text-primary-foreground rounded-lg py-3 font-medium hover:bg-primary/90 transition-colors"
          >
            Back to report
          </button>
        </div>
      </main>
    );
  }

  if (step === 'error') {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-4 bg-background">
        <div className="w-full max-w-lg space-y-4">
          <p className="text-sm text-destructive bg-destructive/10 rounded-lg p-3">{errorMsg}</p>
          <button
            onClick={() => { setStep('form'); setErrorMsg(''); }}
            className="w-full border border-border rounded-lg py-3 text-sm font-medium hover:bg-muted/50"
          >
            Try again
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-8 bg-background">
      <div className="max-w-lg mx-auto">
        <button onClick={() => router.back()} className="text-muted-foreground text-sm mb-6 flex items-center gap-1 hover:text-foreground transition-colors">
          ← Back to report
        </button>

        <h1 className="text-xl font-semibold text-foreground mb-1">Add vehicle information</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Help keep vehicle records accurate. All contributions are reviewed before appearing on reports.
        </p>

        {step === 'select' && (
          <div className="space-y-3">
            {(Object.entries(TYPE_LABELS) as [ContributionType, string][]).map(([type, label]) => (
              <button
                key={type}
                onClick={() => { setSelectedType(type); setStep('form'); }}
                className="w-full text-left rounded-xl border border-border p-4 hover:border-primary/50 hover:bg-muted/30 transition-colors"
              >
                <p className="font-medium text-foreground text-sm">{label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{TYPE_DESCRIPTIONS[type]}</p>
              </button>
            ))}
          </div>
        )}

        {step === 'form' && selectedType && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {TYPE_LABELS[selectedType]}
              </label>
            </div>

            <div>
              <label className="block text-sm text-foreground mb-1">Number plate *</label>
              <input
                value={plate}
                onChange={(e) => setPlate(e.target.value)}
                placeholder="KBX 123A"
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary font-mono"
              />
            </div>

            {selectedType === 'odometer' && (
              <>
                <div>
                  <label className="block text-sm text-foreground mb-1">Reading (km) *</label>
                  <input type="number" value={odometerValue} onChange={(e) => setOdometerValue(e.target.value)}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm text-foreground mb-1">Date observed *</label>
                  <input type="date" value={odometerDate} onChange={(e) => setOdometerDate(e.target.value)}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm text-foreground mb-1">Photo evidence *</label>
                  <input type="file" accept="image/*" multiple onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
                    className="text-sm text-muted-foreground" />
                </div>
              </>
            )}

            {selectedType === 'service_record' && (
              <>
                <div>
                  <label className="block text-sm text-foreground mb-1">Garage name *</label>
                  <input value={serviceName} onChange={(e) => setServiceName(e.target.value)}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm text-foreground mb-1">Service date *</label>
                  <input type="date" value={serviceDate} onChange={(e) => setServiceDate(e.target.value)}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm text-foreground mb-1">Mileage at service *</label>
                  <input type="number" value={serviceMileage} onChange={(e) => setServiceMileage(e.target.value)}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm text-foreground mb-1">Work summary *</label>
                  <textarea value={serviceSummary} onChange={(e) => setServiceSummary(e.target.value)} rows={3}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary resize-none" />
                </div>
              </>
            )}

            {selectedType === 'damage' && (
              <>
                <div>
                  <label className="block text-sm text-foreground mb-1">Date observed *</label>
                  <input type="date" value={damageDate} onChange={(e) => setDamageDate(e.target.value)}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm text-foreground mb-1">Damage location *</label>
                  <input value={damageLocation} onChange={(e) => setDamageLocation(e.target.value)}
                    placeholder="e.g. Front bumper, left side"
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm text-foreground mb-1">Photos *</label>
                  <input type="file" accept="image/*" multiple onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
                    className="text-sm text-muted-foreground" />
                </div>
              </>
            )}

            {selectedType === 'listing_photo' && (
              <div>
                <label className="block text-sm text-foreground mb-1">Photos or screenshots *</label>
                <input type="file" accept="image/*" multiple onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
                  className="text-sm text-muted-foreground" />
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setStep('select')}
                className="flex-1 border border-border rounded-lg py-3 text-sm font-medium hover:bg-muted/50"
              >
                Back
              </button>
              <button
                onClick={submit}
                className="flex-1 bg-primary text-primary-foreground rounded-lg py-3 text-sm font-medium hover:bg-primary/90"
              >
                Submit
              </button>
            </div>
          </div>
        )}

        {step === 'submitting' && (
          <div className="text-center py-12">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Submitting…</p>
          </div>
        )}
      </div>
    </main>
  );
}

export default function ContributePage({ params }: Props) {
  return (
    <Suspense fallback={null}>
      <ContributePageInner params={params} />
    </Suspense>
  );
}
