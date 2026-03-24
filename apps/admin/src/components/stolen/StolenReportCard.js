"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StolenReportCard = StolenReportCard;
// apps/admin/src/components/stolen/StolenReportCard.tsx
const lucide_react_1 = require("lucide-react");
const StatusBadge_1 = require("@/components/ui/StatusBadge");
function StolenReportCard({ report }) {
    return (<div className="rounded-xl border border-white/8 bg-[#141414] p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl font-bold text-zinc-100 font-mono">
              {report.plateDisplay ?? report.plate}
            </span>
            {report.isObVerified && (<span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                OB Verified
              </span>)}
          </div>
          {report.vin && (<p className="text-xs font-mono text-zinc-500">{report.vin}</p>)}
        </div>
        <StatusBadge_1.StolenStatusBadge status={report.status}/>
      </div>

      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div className="flex items-start gap-2">
          <lucide_react_1.Calendar className="w-4 h-4 text-zinc-500 mt-0.5"/>
          <div>
            <dt className="text-xs text-zinc-500">Date Stolen</dt>
            <dd className="text-zinc-200">{report.dateStolenString}</dd>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <lucide_react_1.MapPin className="w-4 h-4 text-zinc-500 mt-0.5"/>
          <div>
            <dt className="text-xs text-zinc-500">Location</dt>
            <dd className="text-zinc-200">{report.countyStolen}, {report.townStolen}</dd>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <lucide_react_1.Shield className="w-4 h-4 text-zinc-500 mt-0.5"/>
          <div>
            <dt className="text-xs text-zinc-500">OB Number</dt>
            <dd className="text-zinc-200">{report.policeObNumber ?? '—'}</dd>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <lucide_react_1.Shield className="w-4 h-4 text-zinc-500 mt-0.5"/>
          <div>
            <dt className="text-xs text-zinc-500">Police Station</dt>
            <dd className="text-zinc-200">{report.policeStation ?? '—'}</dd>
          </div>
        </div>
        {report.contactPhone && (<div className="flex items-start gap-2">
            <lucide_react_1.Phone className="w-4 h-4 text-zinc-500 mt-0.5"/>
            <div>
              <dt className="text-xs text-zinc-500">Phone</dt>
              <dd className="text-zinc-200">{report.contactPhone}</dd>
            </div>
          </div>)}
        {report.contactEmail && (<div className="flex items-start gap-2">
            <lucide_react_1.Mail className="w-4 h-4 text-zinc-500 mt-0.5"/>
            <div>
              <dt className="text-xs text-zinc-500">Email</dt>
              <dd className="text-zinc-200 truncate">{report.contactEmail}</dd>
            </div>
          </div>)}
      </dl>

      <div className="mt-4 pt-4 border-t border-white/6">
        <div className="flex items-center gap-4 text-sm">
          <div>
            <span className="text-zinc-500">Color: </span>
            <span className="text-zinc-200">{report.carColor}</span>
          </div>
          <div>
            <span className="text-zinc-500">Reporter: </span>
            <span className="text-zinc-200 capitalize">{report.reporterType}</span>
          </div>
        </div>
        {report.identifyingMarks && (<p className="mt-2 text-xs text-zinc-500">
            <span className="text-zinc-400">Marks: </span>{report.identifyingMarks}
          </p>)}
      </div>
    </div>);
}
