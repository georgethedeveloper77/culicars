// apps/web/src/app/verify/page.tsx
'use client';

import { Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function VerifyPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const plate = searchParams.get('plate') ?? '';
  const returnTo = searchParams.get('returnTo') ?? '/';

  const [step, setStep] = useState<'intro' | 'uploading' | 'processing' | 'done' | 'error'>('intro');
  const [file, setFile] = useState<File | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [verificationId, setVerificationId] = useState('');

  const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.culicars.com';

  async function startVerification() {
    setStep('uploading');
    try {
      const initRes = await fetch(`${API}/verify/initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ plate }),
      });
      const init = await initRes.json();
      if (!initRes.ok) throw new Error(init.error ?? 'Failed to start verification');

      if (init.alreadyVerified) {
        setStep('done');
        return;
      }

      setVerificationId(init.verificationId);

      // Attempt live fetch first — will return manual_required if disabled
      const liveRes = await fetch(`${API}/verify/${init.verificationId}/live`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ plate }),
      });
      const liveResult = await liveRes.json();

      if (liveResult.status === 'completed') {
        setStep('done');
      }
      // Otherwise stay on 'uploading' step to show PDF upload UI
    } catch (e: any) {
      setErrorMsg(e.message ?? 'Something went wrong');
      setStep('error');
    }
  }

  async function uploadCOR() {
    if (!file || !verificationId) return;
    setStep('processing');
    try {
      const form = new FormData();
      form.append('cor_pdf', file);

      const res = await fetch(`${API}/verify/${verificationId}/upload`, {
        method: 'POST',
        credentials: 'include',
        body: form,
      });
      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.message ?? 'Could not process the document');
      }

      setStep('done');
    } catch (e: any) {
      setErrorMsg(e.message ?? 'Upload failed');
      setStep('error');
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 bg-background">
      <div className="w-full max-w-lg">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-foreground">Verify official record</h1>
          {plate && (
            <p className="text-muted-foreground mt-1">
              Plate: <span className="font-mono font-medium text-foreground">{plate}</span>
            </p>
          )}
        </div>

        {step === 'intro' && (
          <div className="space-y-4">
            <p className="text-muted-foreground text-sm leading-relaxed">
              Verify ownership using an official Certificate of Registration (COR) from the transport authority.
              Owner details are never stored — only vehicle information is used.
            </p>
            <button
              onClick={startVerification}
              className="w-full bg-primary text-primary-foreground rounded-lg py-3 font-medium hover:bg-primary/90 transition-colors"
            >
              Start verification
            </button>
            <button
              onClick={() => router.back()}
              className="w-full text-muted-foreground text-sm py-2 hover:text-foreground transition-colors"
            >
              Cancel
            </button>
          </div>
        )}

        {step === 'uploading' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Upload your Certificate of Registration (COR) PDF to verify this vehicle.
            </p>
            <label className="block border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors">
              <input
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              {file ? (
                <span className="text-sm text-foreground font-medium">{file.name}</span>
              ) : (
                <span className="text-sm text-muted-foreground">Tap to select COR PDF</span>
              )}
            </label>
            {file && (
              <button
                onClick={uploadCOR}
                className="w-full bg-primary text-primary-foreground rounded-lg py-3 font-medium hover:bg-primary/90 transition-colors"
              >
                Upload and verify
              </button>
            )}
          </div>
        )}

        {step === 'processing' && (
          <div className="text-center py-12 space-y-3">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
            <p className="text-muted-foreground text-sm">Reading document…</p>
          </div>
        )}

        {step === 'done' && (
          <div className="text-center space-y-4">
            <div className="h-12 w-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
              <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-foreground">Verification complete</h2>
            <p className="text-sm text-muted-foreground">
              Official records have been confirmed. The report has been updated.
            </p>
            <button
              onClick={() => router.push(returnTo)}
              className="w-full bg-primary text-primary-foreground rounded-lg py-3 font-medium hover:bg-primary/90 transition-colors"
            >
              View updated report
            </button>
          </div>
        )}

        {step === 'error' && (
          <div className="space-y-4">
            <p className="text-sm text-destructive bg-destructive/10 rounded-lg p-3">{errorMsg}</p>
            <button
              onClick={() => { setStep('intro'); setErrorMsg(''); }}
              className="w-full border border-border rounded-lg py-3 text-sm font-medium hover:bg-muted/50 transition-colors"
            >
              Try again
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" /></div>}>
      <VerifyPageInner />
    </Suspense>
  );
}
