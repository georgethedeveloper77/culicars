"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.OdometerSection = OdometerSection;
// apps/web/src/components/report/OdometerSection.tsx
const recharts_1 = require("recharts");
const CustomDot = (props) => {
    const { cx, cy, payload } = props;
    if (!cx || !cy)
        return null;
    if (payload?.isRollback) {
        return (<g>
        <circle cx={cx} cy={cy} r={7} fill="#ef4444" stroke="#0a0c10" strokeWidth={2}/>
        <text x={cx} y={cy - 12} textAnchor="middle" fontSize={9} fill="#ef4444" fontWeight="bold">
          ROLLBACK
        </text>
      </g>);
    }
    return <circle cx={cx} cy={cy} r={4} fill="#f5a623" stroke="#0a0c10" strokeWidth={2}/>;
};
const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length)
        return null;
    const rec = payload[0].payload;
    return (<div className="cc-card text-xs p-3 shadow-xl">
      <p className="font-semibold text-cc-text mb-1">{rec.mileage.toLocaleString()} km</p>
      <p className="text-cc-muted">{new Date(rec.date).toLocaleDateString('en-KE', { year: 'numeric', month: 'short' })}</p>
      <p className="text-cc-muted">{rec.source}</p>
      {rec.isRollback && <p className="text-red-400 font-semibold mt-1">⚠ Rollback detected</p>}
    </div>);
};
function OdometerSection({ data }) {
    const records = data?.records || [];
    const chartData = records
        .slice()
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const rollbackIndices = chartData
        .map((r, i) => ({ ...r, i }))
        .filter(r => r.isRollback)
        .map(r => r.i);
    return (<div className="p-6 space-y-6">
      {/* Summary row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="cc-card-2 p-4">
          <p className="text-xs text-cc-muted mb-1">Last known mileage</p>
          <p className="text-xl font-bold text-cc-text">
            {data.lastKnownMileage?.toLocaleString() ?? '—'} km
          </p>
        </div>
        {data.averageForSimilar && (<div className="cc-card-2 p-4">
            <p className="text-xs text-cc-muted mb-1">Average for similar</p>
            <p className="text-xl font-bold text-cc-text">{data.averageForSimilar.toLocaleString()} km</p>
          </div>)}
        <div className={`p-4 rounded-xl border ${data.rollbackDetected
            ? 'bg-red-950/30 border-red-600/30'
            : 'cc-card-2'}`}>
          <p className="text-xs text-cc-muted mb-1">Rollback detection</p>
          <p className={`text-base font-bold ${data.rollbackDetected ? 'text-red-400' : 'text-emerald-400'}`}>
            {data.rollbackDetected ? '⚠ Rollback detected' : '✓ No rollback'}
          </p>
        </div>
      </div>

      {/* Chart */}
      {chartData.length > 1 && (<div>
          <p className="text-xs text-cc-muted mb-3">Mileage over time</p>
          <div className="h-52">
            <recharts_1.ResponsiveContainer width="100%" height="100%">
              <recharts_1.LineChart data={chartData} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                <recharts_1.CartesianGrid strokeDasharray="3 3" stroke="#1e2330"/>
                <recharts_1.XAxis dataKey="date" tickFormatter={d => new Date(d).toLocaleDateString('en-KE', { year: '2-digit', month: 'short' })} tick={{ fill: '#8892a4', fontSize: 10 }} axisLine={false} tickLine={false}/>
                <recharts_1.YAxis tickFormatter={v => `${(v / 1000).toFixed(0)}k`} tick={{ fill: '#8892a4', fontSize: 10 }} axisLine={false} tickLine={false} width={35}/>
                <recharts_1.Tooltip content={<CustomTooltip />}/>

                {/* Mark rollback reference lines */}
                {rollbackIndices.map(idx => (<recharts_1.ReferenceLine key={idx} x={chartData[idx]?.date} stroke="#ef4444" strokeDasharray="4 2" label={{ value: '↓ Rollback', fill: '#ef4444', fontSize: 9 }}/>))}

                <recharts_1.Line type="monotone" dataKey="mileage" stroke="#f5a623" strokeWidth={2} dot={<CustomDot />} activeDot={{ r: 6, fill: '#f5a623' }}/>
              </recharts_1.LineChart>
            </recharts_1.ResponsiveContainer>
          </div>
        </div>)}

      {/* Records table */}
      {records.length > 0 && (<div>
          <p className="text-xs text-cc-muted mb-3">Mileage records</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-cc-border">
                  <th className="text-left text-xs text-cc-muted font-medium pb-2 pr-4">Date</th>
                  <th className="text-right text-xs text-cc-muted font-medium pb-2 pr-4">Mileage</th>
                  <th className="text-left text-xs text-cc-muted font-medium pb-2">Source</th>
                  <th className="text-left text-xs text-cc-muted font-medium pb-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cc-border/50">
                {records
                .slice()
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((rec, i) => (<tr key={i} className={rec.isRollback ? 'bg-red-950/20' : ''}>
                      <td className="py-2 pr-4 text-cc-muted text-xs">
                        {new Date(rec.date).toLocaleDateString('en-KE', { year: 'numeric', month: 'short' })}
                      </td>
                      <td className={`py-2 pr-4 text-right font-mono font-semibold ${rec.isRollback ? 'text-red-400' : 'text-cc-text'}`}>
                        {rec.mileage.toLocaleString()} km
                      </td>
                      <td className="py-2 pr-4 text-cc-muted text-xs">{rec.source}</td>
                      <td className="py-2">
                        {rec.isRollback ? (<span className="cc-pill bg-red-600/10 text-red-400 border border-red-600/30 text-xs">
                            ⚠ Rollback
                          </span>) : (<span className="text-cc-faint text-xs">—</span>)}
                      </td>
                    </tr>))}
              </tbody>
            </table>
          </div>
        </div>)}
    </div>);
}
