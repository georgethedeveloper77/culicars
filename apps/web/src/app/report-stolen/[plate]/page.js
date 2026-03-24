"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = PlateStolenPage;
// apps/web/src/app/report-stolen/[plate]/page.tsx
const react_1 = require("react");
const navigation_1 = require("next/navigation");
const StolenReportForm_1 = require("@/components/stolen/StolenReportForm");
const StolenReportSuccess_1 = require("@/components/stolen/StolenReportSuccess");
const RecoveryReportForm_1 = require("@/components/stolen/RecoveryReportForm");
const react_2 = require("react");
function PlateReportContent() {
    const { plate } = (0, navigation_1.useParams)();
    const searchParams = (0, navigation_1.useSearchParams)();
    const action = searchParams.get('action');
    const reportId = searchParams.get('reportId') || '';
    const decodedPlate = decodeURIComponent(plate || '').toUpperCase();
    const [successId, setSuccessId] = (0, react_1.useState)(null);
    const [recovered, setRecovered] = (0, react_1.useState)(false);
    if (recovered) {
        return (<div className="max-w-md mx-auto py-12 text-center cc-card p-8">
        <span className="text-4xl block mb-3">✓</span>
        <h2 className="text-xl font-bold text-cc-text mb-2">Recovery reported</h2>
        <p className="text-cc-muted text-sm">
          The stolen report for <span className="font-mono font-semibold text-cc-text">{decodedPlate}</span> has been
          updated. The community will be notified.
        </p>
      </div>);
    }
    if (successId) {
        return <StolenReportSuccess_1.StolenReportSuccess plate={decodedPlate} reportId={successId}/>;
    }
    if (action === 'recover' && reportId) {
        return (<div className="max-w-lg mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-cc-text mb-2">Mark Vehicle as Recovered</h1>
          <p className="text-cc-muted">
            Submit a recovery report for{' '}
            <span className="font-mono font-semibold text-cc-text">{decodedPlate}</span>
          </p>
        </div>
        <div className="cc-card p-6">
          <RecoveryReportForm_1.RecoveryReportForm reportId={reportId} plate={decodedPlate} onSuccess={() => setRecovered(true)}/>
        </div>
      </div>);
    }
    return (<div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">🚨</span>
          <h1 className="text-2xl font-bold text-cc-text">Report Stolen Vehicle</h1>
        </div>
        <div className="flex items-center gap-3 mt-1">
          <span className="plate-badge text-base">{decodedPlate}</span>
          <span className="text-cc-muted text-sm">Pre-filled from your search</span>
        </div>
      </div>

      <StolenReportForm_1.StolenReportForm defaultPlate={decodedPlate} onSuccess={id => setSuccessId(id)}/>
    </div>);
}
function PlateStolenPage() {
    return (<div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <react_2.Suspense fallback={<div className="flex justify-center py-20"><div className="w-8 h-8 rounded-full border-2 border-cc-border border-t-cc-accent animate-spin"/></div>}>
        <PlateReportContent />
      </react_2.Suspense>
    </div>);
}
