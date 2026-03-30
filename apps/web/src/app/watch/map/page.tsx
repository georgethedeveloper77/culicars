// apps/web/src/app/watch/map/page.tsx
'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Leaflet must be loaded client-side only (no SSR)
const WatchMapClient = dynamic(() => import('./WatchMapClient'), { ssr: false });

export default function WatchMapPage() {
  return (
    <div className="flex flex-col h-screen">
      <header className="flex items-center justify-between px-4 py-3 border-b bg-white dark:bg-gray-900 shrink-0">
        <div>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Watch Map</h1>
          <p className="text-xs text-gray-500">Community-reported vehicle alerts in Kenya</p>
        </div>
        <a
          href="/watch/feed"
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          View feed →
        </a>
      </header>
      <Suspense fallback={<MapSkeleton />}>
        <WatchMapClient />
      </Suspense>
    </div>
  );
}

function MapSkeleton() {
  return (
    <div className="flex-1 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
      <p className="text-gray-500 text-sm">Loading map…</p>
    </div>
  );
}
