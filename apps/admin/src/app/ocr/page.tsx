// apps/admin/src/app/ocr/page.tsx
'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { JobStatusBadge } from '@/components/ui/StatusBadge';
import { apiGet, apiPost } from '@/lib/api';

interface CorRecord {
  id: string;
  vin: string;
  plate: string | null;
  source: string;
  confidence: number;
  normalisedData: Record<string, unknown>;
  createdAt: string;
}

export default function OcrPage() {
  const [vin, setVin] = useState('');
  const [record, setRecord] = useState<CorRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // PDF upload state
  const [pdfVin, setPdfVin] = useState('');
  const [pdfPlate, setPdfPlate] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<Record<string, unknown> | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function fetchLastRecord() {
    if (!vin.trim()) return;
    setLoading(true);
    setError(null);
    setRecord(null);
    try {
      const data = await apiGet<CorRecord>(`/ocr/ntsa-cor/last/${vin.trim().toUpperCase()}`);
      setRecord(data);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to fetch record');
    } finally {
      setLoading(false);
    }
  }

  async function uploadCor() {
    if (!pdfFile || (!pdfVin.trim() && !pdfPlate.trim())) return;
    setUploading(true);
    setUploadError(null);
    setUploadResult(null);

    const form = new FormData();
    form.append('pdf', pdfFile);
    if (pdfVin.trim()) form.append('vin', pdfVin.trim().toUpperCase());
    if (pdfPlate.trim()) form.append('plate', pdfPlate.trim().toUpperCase());

    try {
      const data = await apiPost<Record<string, unknown>>("/ocr/ntsa-cor", form);
      setUploadResult(data);
    } catch (e: any) {
      setUploadError(e?.message ?? 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  const conf = record ? Math.round(record.confidence * 100) : null;
  const confColour =
    conf === null ? 'gray' : conf >= 80 ? 'green' : conf >= 50 ? 'yellow' : 'red';

  return (
    <div className="p-6 space-y-8">
      <PageHeader
        title="Official Record OCR"
        description="Parse and view Certificate of Registration (COR) data extracted from official PDFs."
      />

      {/* ── Lookup last parse ── */}
      <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-6 space-y-4">
        <h2 className="font-semibold text-gray-800 dark:text-gray-100 text-sm uppercase tracking-wide">
          Last Parse Result
        </h2>

        <div className="flex gap-3">
          <input
            type="text"
            value={vin}
            onChange={(e) => setVin(e.target.value)}
            placeholder="Enter VIN"
            className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyDown={(e) => e.key === 'Enter' && fetchLastRecord()}
          />
          <button
            onClick={fetchLastRecord}
            disabled={loading || !vin.trim()}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {loading ? 'Loading…' : 'Fetch'}
          </button>
        </div>

        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}

        {record && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500">Confidence</span>
              <span className="text-xs font-medium">{conf}%</span>
              <span className="text-xs text-gray-400 ml-auto">
                Parsed {new Date(record.createdAt).toLocaleString()}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Object.entries(record.normalisedData ?? {}).map(([key, val]) => (
                <div
                  key={key}
                  className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-xs space-y-1"
                >
                  <p className="text-gray-400 uppercase tracking-wide">{key}</p>
                  <p className="text-gray-800 dark:text-gray-100 font-medium">
                    {val === null || val === undefined ? '—' : String(val)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ── Upload COR PDF ── */}
      <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-6 space-y-4">
        <h2 className="font-semibold text-gray-800 dark:text-gray-100 text-sm uppercase tracking-wide">
          Upload COR PDF
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            type="text"
            value={pdfVin}
            onChange={(e) => setPdfVin(e.target.value)}
            placeholder="VIN (optional if plate provided)"
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            value={pdfPlate}
            onChange={(e) => setPdfPlate(e.target.value)}
            placeholder="Plate (optional if VIN provided)"
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex gap-3 items-center">
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setPdfFile(e.target.files?.[0] ?? null)}
            className="text-sm text-gray-600 dark:text-gray-300 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          <button
            onClick={uploadCor}
            disabled={uploading || !pdfFile || (!pdfVin.trim() && !pdfPlate.trim())}
            className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 transition"
          >
            {uploading ? 'Parsing…' : 'Parse & Store'}
          </button>
        </div>

        {uploadError && (
          <p className="text-sm text-red-500">{uploadError}</p>
        )}

        {uploadResult && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-sm space-y-2">
            <p className="text-green-700 dark:text-green-400 font-medium">
              ✓ Parsed successfully
            </p>
            <p className="text-gray-500 text-xs">
              Record ID: <code className="font-mono">{String(uploadResult.rawRecordId)}</code>
            </p>
            <p className="text-gray-500 text-xs">
              Confidence: {Math.round(Number(uploadResult.confidence) * 100)}%
            </p>
            {(uploadResult.warnings as string[])?.length > 0 && (
              <p className="text-yellow-600 dark:text-yellow-400 text-xs">
                Warnings: {(uploadResult.warnings as string[]).join(', ')}
              </p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
