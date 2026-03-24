"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportCover = ReportCover;
const RiskBadge_1 = require("./RiskBadge");
const SectionIconCard_1 = require("./SectionIconCard");
const constants_1 = require("@/lib/constants");
function getSectionStatus(sections, type) {
    const s = sections.find(s => s.sectionType === type);
    if (!s)
        return 'not_checked';
    return s.dataStatus === 'found' ? 'found' : s.dataStatus === 'not_found' ? 'not_found' : 'not_checked';
}
function isSectionLocked(sections, type) {
    const s = sections.find(s => s.sectionType === type);
    return s?.isLocked ?? true;
}
function ReportCover({ report, onSectionClick }) {
    const v = report.vehicle;
    // Support both data shapes:
    // Shape A (old): { urls: [...] }
    // Shape B (new): { groups: [{ photos: [...] }] }
    const photosData = report.sections
        .find(s => s.sectionType === 'PHOTOS')
        ?.data;
    const coverPhoto = photosData?.urls?.[0] ??
        photosData?.groups?.[0]?.photos?.[0] ??
        null;
    return (<div className="cc-card overflow-hidden">
      {/* Photo banner */}
      <div className="relative h-48 sm:h-64 bg-cc-surface-2 flex items-center justify-center overflow-hidden">
        {coverPhoto ? (<img src={coverPhoto} alt={`${v.year} ${v.make} ${v.model}`} className="w-full h-full object-cover"/>) : (<div className="flex flex-col items-center gap-2 text-cc-faint">
            <span className="text-5xl">🚗</span>
            <span className="text-sm">No photo available</span>
          </div>)}

        {/* Risk badge overlay */}
        <div className="absolute top-4 right-4">
          <RiskBadge_1.RiskBadge level={report.riskLevel} score={report.riskScore} size="md"/>
        </div>

        {/* NTSA badge */}
        {v.ntsa_cor_verified && (<div className="absolute top-4 left-4">
            <span className="cc-pill bg-blue-500/90 text-white text-xs">
              🏛️ NTSA Verified
            </span>
          </div>)}
      </div>

      {/* Vehicle identity */}
      <div className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-cc-text">
              {v.year} {v.make} {v.model}
            </h1>
            <div className="flex items-center gap-3 flex-wrap mt-2">
              <span className="plate-badge">{v.plate}</span>
              <span className="font-mono text-xs text-cc-faint bg-cc-surface-2 border border-cc-border px-2 py-1 rounded">
                {report.vin}
              </span>
            </div>

            {/* Quick specs */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs text-cc-muted">
              {v.bodyType && <span>{v.bodyType}</span>}
              {v.engineCc && <span>{v.engineCc}cc</span>}
              {v.fuelType && <span>{v.fuelType}</span>}
              {v.transmission && <span>{v.transmission}</span>}
              {v.country_of_origin && <span>Origin: {v.country_of_origin}</span>}
            </div>
          </div>

          {/* Sources count */}
          <div className="cc-card-2 px-4 py-3 text-center shrink-0">
            <p className="text-2xl font-bold text-cc-text">{report.sourcesChecked}</p>
            <p className="text-xs text-cc-muted">Sources checked</p>
            <p className="text-lg font-semibold text-cc-accent mt-1">{report.recordsFound}</p>
            <p className="text-xs text-cc-muted">Records found</p>
          </div>
        </div>

        {/* 5 section icon cards */}
        <div className="grid grid-cols-5 gap-2 mt-6">
          {constants_1.COVER_SECTION_CARDS.map(card => (<SectionIconCard_1.SectionIconCard key={card.key} icon={card.icon} label={card.label} status={getSectionStatus(report.sections, card.key)} isLocked={isSectionLocked(report.sections, card.key)} onClick={() => onSectionClick?.(card.key)}/>))}
        </div>

        {/* Recommendation pill */}
        <div className="mt-4 flex items-center gap-3">
          <span className="text-xs text-cc-muted">Recommendation:</span>
          <span className={`cc-pill text-xs font-semibold ${report.recommendation === 'proceed' ? 'bg-emerald-500/10 text-emerald-400' :
            report.recommendation === 'caution' ? 'bg-amber-500/10 text-amber-400' :
                'bg-red-600/10 text-red-400'}`}>
            {report.recommendation === 'proceed' ? '✓ Proceed with confidence' :
            report.recommendation === 'caution' ? '▲ Proceed with caution' :
                '✕ Avoid this vehicle'}
          </span>
        </div>
      </div>
    </div>);
}
