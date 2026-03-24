"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.DamageSection = DamageSection;
// Dot positions on the SVG diagram (as % of 300x500 viewbox)
const ZONE_POSITIONS = {
    front: { cx: 150, cy: 60 },
    rear: { cx: 150, cy: 440 },
    left: { cx: 30, cy: 250 },
    right: { cx: 270, cy: 250 },
    roof: { cx: 150, cy: 200 },
    underbody: { cx: 150, cy: 320 },
    'front-left': { cx: 60, cy: 100 },
    'front-right': { cx: 240, cy: 100 },
    'rear-left': { cx: 60, cy: 400 },
    'rear-right': { cx: 240, cy: 400 },
};
function CarSilhouette({ incidents }) {
    return (<svg viewBox="0 0 300 500" className="w-full max-w-[180px] mx-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Body outline — top-down view */}
      <rect x="60" y="30" width="180" height="440" rx="40" fill="#1e2330" stroke="#252c3a" strokeWidth="2"/>
      {/* Windshield */}
      <rect x="80" y="60" width="140" height="80" rx="10" fill="#111318" stroke="#252c3a" strokeWidth="1.5"/>
      {/* Rear window */}
      <rect x="80" y="360" width="140" height="70" rx="10" fill="#111318" stroke="#252c3a" strokeWidth="1.5"/>
      {/* Roof */}
      <rect x="90" y="170" width="120" height="130" rx="8" fill="#181c24" stroke="#252c3a" strokeWidth="1"/>
      {/* Left wheels */}
      <rect x="22" y="100" width="38" height="60" rx="8" fill="#0a0c10" stroke="#252c3a" strokeWidth="2"/>
      <rect x="22" y="340" width="38" height="60" rx="8" fill="#0a0c10" stroke="#252c3a" strokeWidth="2"/>
      {/* Right wheels */}
      <rect x="240" y="100" width="38" height="60" rx="8" fill="#0a0c10" stroke="#252c3a" strokeWidth="2"/>
      <rect x="240" y="340" width="38" height="60" rx="8" fill="#0a0c10" stroke="#252c3a" strokeWidth="2"/>
      {/* Center line */}
      <line x1="150" y1="30" x2="150" y2="470" stroke="#252c3a" strokeWidth="1" strokeDasharray="4 4"/>

      {/* Damage dots */}
      {incidents.map((inc, i) => {
            const zone = inc.zone?.toLowerCase().replace(/\s+/g, '-') || 'front';
            const pos = ZONE_POSITIONS[zone] || ZONE_POSITIONS.front;
            const isSevere = inc.severity === 'severe_damage';
            return (<g key={inc.id || i}>
            {/* Outer glow ring */}
            <circle cx={pos.cx} cy={pos.cy} r={isSevere ? 18 : 14} fill={isSevere ? 'rgba(239,68,68,0.15)' : 'rgba(234,179,8,0.15)'}/>
            {/* Main dot */}
            <circle cx={pos.cx} cy={pos.cy} r={isSevere ? 10 : 8} fill={isSevere ? '#ef4444' : '#eab308'} opacity={0.9}/>
            {/* Index number */}
            <text x={pos.cx} y={pos.cy + 4} textAnchor="middle" fontSize="8" fontFamily="monospace" fill="white" fontWeight="bold">
              {i + 1}
            </text>
          </g>);
        })}
    </svg>);
}
function DamageSection({ data }) {
    const incidents = data?.incidents || [];
    if (incidents.length === 0) {
        return (<div className="p-6 text-center">
        <span className="text-4xl block mb-2">✓</span>
        <p className="text-emerald-400 font-medium">No damage records found</p>
        <p className="text-cc-muted text-sm mt-1">No damage incidents in our database for this vehicle</p>
      </div>);
    }
    return (<div className="p-6">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Car diagram */}
        <div className="shrink-0 flex flex-col items-center">
          <p className="text-xs text-cc-muted mb-3 text-center">Damage locations</p>
          <CarSilhouette incidents={incidents}/>
          <div className="flex items-center gap-4 mt-3 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-500 inline-block"/>
              <span className="text-cc-muted">Damage</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-600 inline-block"/>
              <span className="text-cc-muted">Severe</span>
            </span>
          </div>
        </div>

        {/* Incident list */}
        <div className="flex-1 space-y-3">
          {incidents.map((inc, i) => (<div key={inc.id || i} className="cc-card-2 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  {/* Number badge */}
                  <span className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${inc.severity === 'severe_damage' ? 'bg-red-600' : 'bg-amber-500'}`}>
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-medium text-cc-text text-sm">{inc.location}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className={`cc-pill text-xs ${inc.severity === 'severe_damage'
                ? 'bg-red-600/10 text-red-400 border border-red-600/30'
                : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'}`}>
                        {inc.severity === 'severe_damage' ? '⚠ Severe damage' : '▲ Damage'}
                      </span>
                      {inc.possibleCause && inc.possibleCause !== 'Unknown' && (<span className="cc-pill bg-cc-surface text-cc-muted text-xs">{inc.possibleCause}</span>)}
                    </div>
                    {inc.severity === 'severe_damage' && (<p className="text-xs text-orange-400/80 mt-1.5">
                        ⚠ Severe damage can leave structural issues making vehicle unsafe
                      </p>)}
                  </div>
                </div>

                {/* Cost range */}
                <div className="shrink-0 text-right">
                  <p className="text-cc-text font-semibold text-sm">
                    {inc.costRangeKes
                ? inc.costRangeKes
                : inc.costRangeMin != null && inc.costRangeMax != null
                    ? `KSh ${inc.costRangeMin.toLocaleString()} — KSh ${inc.costRangeMax.toLocaleString()}`
                    : 'Cost unknown'}
                  </p>
                  <p className="text-cc-faint text-xs">est. repair</p>
                </div>
              </div>

              {/* Date / county / source */}
              <div className="flex items-center gap-3 mt-3 pt-3 border-t border-cc-border text-xs text-cc-faint flex-wrap">
                {inc.date && <span>📅 {new Date(inc.date).toLocaleDateString('en-KE', { year: 'numeric', month: 'short' })}</span>}
                {inc.county && <span>📍 {inc.county}</span>}
                {inc.source && <span>Source: {inc.source}</span>}
              </div>
            </div>))}
        </div>
      </div>
    </div>);
}
