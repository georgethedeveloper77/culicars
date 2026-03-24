"use strict";
// apps/web/src/components/report/SectionIconCard.tsx
Object.defineProperty(exports, "__esModule", { value: true });
exports.SectionIconCard = SectionIconCard;
function SectionIconCard({ icon, label, status, isLocked, onClick }) {
    const statusEl = {
        found: (<span className="flex items-center gap-1 text-amber-400 text-xs font-medium">
        <span>▲</span> Issue found
      </span>),
        not_found: (<span className="flex items-center gap-1 text-emerald-400 text-xs font-medium">
        <span>✓</span> Clean
      </span>),
        not_checked: (<span className="flex items-center gap-1 text-cc-faint text-xs">
        <span>—</span> Not checked
      </span>),
    }[status];
    return (<button onClick={onClick} className={`cc-card p-3 text-left group transition-colors w-full ${onClick ? 'hover:border-cc-accent/30 cursor-pointer' : 'cursor-default'}`}>
      <div className="text-2xl mb-2">{icon}</div>
      <p className="text-xs font-medium text-cc-text mb-1 truncate">{label}</p>
      {statusEl}
      {isLocked && (<span className="mt-1 block text-xs text-cc-faint">🔒 Locked</span>)}
    </button>);
}
