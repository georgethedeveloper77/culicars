"use strict";
// apps/admin/src/components/ui/DataTable.tsx
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataTable = DataTable;
function DataTable({ columns, data, loading = false, emptyMessage = 'No records found.', onRowClick, }) {
    if (loading) {
        return (<div className="rounded-xl border border-white/8 overflow-hidden">
        <div className="animate-pulse">
          {[...Array(5)].map((_, i) => (<div key={i} className="flex gap-4 px-6 py-4 border-b border-white/5">
              {columns.map((col) => (<div key={col.key} className="h-4 bg-white/10 rounded flex-1"/>))}
            </div>))}
        </div>
      </div>);
    }
    if (!data.length) {
        return (<div className="rounded-xl border border-white/8 p-12 text-center">
        <p className="text-zinc-500 text-sm">{emptyMessage}</p>
      </div>);
    }
    return (<div className="rounded-xl border border-white/8 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-white/3 border-b border-white/8">
            {columns.map((col) => (<th key={col.key} className="px-6 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-widest" style={col.width ? { width: col.width } : undefined}>
                {col.header}
              </th>))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (<tr key={row.id ?? i} onClick={() => onRowClick?.(row)} className={`border-b border-white/5 last:border-0 transition-colors ${onRowClick ? 'cursor-pointer hover:bg-white/4' : ''}`}>
              {columns.map((col) => (<td key={col.key} className="px-6 py-4 text-zinc-200">
                  {col.render(row)}
                </td>))}
            </tr>))}
        </tbody>
      </table>
    </div>);
}
