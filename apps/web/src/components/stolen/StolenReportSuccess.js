"use strict";
'use client';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StolenReportSuccess = StolenReportSuccess;
// apps/web/src/components/stolen/StolenReportSuccess.tsx
const link_1 = __importDefault(require("next/link"));
function StolenReportSuccess({ plate, reportId }) {
    const shareText = `🚨 Vehicle reported stolen: ${plate}. Check CuliCars for full details. culicars.com/search?q=${plate}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    return (<div className="max-w-md mx-auto text-center space-y-6 py-8">
      <div className="cc-card p-8">
        {/* Success icon */}
        <div className="w-16 h-16 rounded-full bg-red-600/10 border border-red-600/30 flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">🚨</span>
        </div>

        <h2 className="text-xl font-bold text-cc-text mb-2">Report Submitted</h2>
        <p className="text-cc-muted text-sm mb-1">
          Your stolen vehicle report for{' '}
          <span className="font-mono font-semibold text-cc-text">{plate}</span> has been submitted.
        </p>
        <p className="text-cc-muted text-sm mb-6">
          Our team will review it shortly. Once approved, a stolen alert will appear on every search for this plate — free, with no credits needed.
        </p>

        {/* Steps */}
        <div className="text-left space-y-2 mb-6">
          {[
            { icon: '⏳', text: 'Admin reviews your report (usually within 24 hours)' },
            { icon: '✓', text: 'Approved reports trigger a RED stolen alert on all searches' },
            { icon: '🔒', text: 'Vehicle is flagged in our database automatically' },
        ].map((step, i) => (<div key={i} className="flex items-start gap-3 text-sm">
              <span>{step.icon}</span>
              <span className="text-cc-muted">{step.text}</span>
            </div>))}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="cc-btn-primary w-full">
            📲 Share on WhatsApp
          </a>
          <link_1.default href={`/search?q=${encodeURIComponent(plate)}`} className="cc-btn-secondary w-full">
            Search this plate
          </link_1.default>
          <link_1.default href="/" className="text-sm text-cc-muted hover:text-cc-text transition-colors">
            Back to home
          </link_1.default>
        </div>
      </div>
    </div>);
}
