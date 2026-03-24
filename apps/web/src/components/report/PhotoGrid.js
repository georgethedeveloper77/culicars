"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.PhotoGrid = PhotoGrid;
// apps/web/src/components/report/PhotoGrid.tsx
const react_1 = require("react");
function PhotoGrid({ data }) {
    const [lightboxSrc, setLightboxSrc] = (0, react_1.useState)(null);
    const groups = data?.groups || [];
    if (groups.length === 0) {
        return (<div className="p-6 text-center text-cc-muted">
        <span className="text-4xl block mb-2">📷</span>
        <p className="text-sm">No photos available for this vehicle.</p>
      </div>);
    }
    return (<div className="p-6 space-y-6">
      {groups.map(group => (<div key={group.date}>
          {/* Date header */}
          <div className="flex items-center gap-3 mb-3">
            <span className="text-xs font-mono font-semibold text-cc-muted bg-cc-surface-2 px-2.5 py-1 rounded border border-cc-border">
              {group.date}
            </span>
            <span className="text-xs text-cc-faint">{group.photos.length} photo{group.photos.length !== 1 ? 's' : ''}</span>
            {group.source && <span className="text-xs text-cc-faint">· {group.source}</span>}
          </div>

          {/* 3-column grid */}
          <div className="grid grid-cols-3 gap-2">
            {group.photos.map((url, i) => (<button key={i} onClick={() => setLightboxSrc(url)} className="aspect-video rounded-lg overflow-hidden bg-cc-surface-2 hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-cc-accent">
                <img src={url} alt={`Vehicle photo from ${group.date}`} className="w-full h-full object-cover" loading="lazy"/>
              </button>))}
          </div>
        </div>))}

      {/* Lightbox */}
      {lightboxSrc && (<div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4" onClick={() => setLightboxSrc(null)}>
          <img src={lightboxSrc} alt="Vehicle photo" className="max-w-full max-h-full object-contain rounded-lg" onClick={e => e.stopPropagation()}/>
          <button onClick={() => setLightboxSrc(null)} className="absolute top-4 right-4 text-white/70 hover:text-white text-2xl font-light" aria-label="Close">
            ✕
          </button>
        </div>)}
    </div>);
}
