// apps/web/src/app/watch/map/WatchMapClient.tsx
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import 'leaflet/dist/leaflet.css';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.culicars.com';

// Nairobi default centre
const DEFAULT_LAT = -1.2921;
const DEFAULT_LNG = 36.8219;
const DEFAULT_ZOOM = 13;

interface Pin {
  id: string;
  plate: string | null;
  type: string;
  lat: number;
  lng: number;
  description: string | null;
  createdAt: string;
}

interface AlertDetail extends Pin {
  vin: string | null;
}

const ALERT_COLOURS: Record<string, string> = {
  stolen_vehicle: '#ef4444',
  recovered_vehicle: '#22c55e',
  damage: '#f97316',
  vandalism: '#a855f7',
  parts_theft: '#f59e0b',
  suspicious_activity: '#6366f1',
  hijack: '#dc2626',
};

function markerColour(type: string) {
  return ALERT_COLOURS[type] ?? '#64748b';
}

function alertLabel(type: string) {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function WatchMapClient() {
  const mapRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<any[]>([]);
  const [pins, setPins] = useState<Pin[]>([]);
  const [selected, setSelected] = useState<AlertDetail | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const fetchPins = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (typeFilter) params.set('type', typeFilter);
      const res = await fetch(`${API}/watch/map/pins?${params}`);
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setPins(data.pins ?? []);
    } catch {
      // silently keep previous pins
    } finally {
      setLoading(false);
    }
  }, [typeFilter]);

  useEffect(() => {
    fetchPins();
  }, [fetchPins]);

  // Init Leaflet map once
  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;

    // Leaflet is loaded dynamically; wait for window
    import('leaflet').then((L) => {
      // Fix default icon paths broken by webpack
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const map = L.map(containerRef.current!, {
        center: [DEFAULT_LAT, DEFAULT_LNG],
        zoom: DEFAULT_ZOOM,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      mapRef.current = map;

      // Try to centre on user location
      navigator.geolocation?.getCurrentPosition((pos) => {
        map.setView([pos.coords.latitude, pos.coords.longitude], DEFAULT_ZOOM);
      });
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // Re-render markers when pins change
  useEffect(() => {
    if (!mapRef.current) return;

    import('leaflet').then((L) => {
      // Clear existing
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      pins.forEach((pin) => {
        const colour = markerColour(pin.type);
        const icon = L.divIcon({
          className: '',
          html: `<div style="width:14px;height:14px;border-radius:50%;background:${colour};border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>`,
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        });

        const marker = L.marker([pin.lat, pin.lng], { icon })
          .addTo(mapRef.current)
          .on('click', async () => {
            try {
              const res = await fetch(`${API}/watch/map/pins/${pin.id}`);
              if (res.ok) {
                const d = await res.json();
                setSelected(d.alert);
              }
            } catch {
              setSelected({ ...pin, vin: null });
            }
          });

        markersRef.current.push(marker);
      });
    });
  }, [pins]);

  const TYPES = [
    'stolen_vehicle',
    'recovered_vehicle',
    'damage',
    'vandalism',
    'parts_theft',
    'suspicious_activity',
    'hijack',
  ];

  return (
    <div className="flex-1 relative flex flex-col" style={{ minHeight: 0 }}>
      {/* Filter bar */}
      <div className="absolute top-3 left-3 right-3 z-[1000] flex gap-2 flex-wrap">
        <button
          onClick={() => setTypeFilter('')}
          className={`px-3 py-1 rounded-full text-xs font-medium shadow ${
            typeFilter === '' ? 'bg-gray-900 text-white' : 'bg-white text-gray-700 border'
          }`}
        >
          All
        </button>
        {TYPES.map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(t === typeFilter ? '' : t)}
            className={`px-3 py-1 rounded-full text-xs font-medium shadow ${
              typeFilter === t ? 'text-white' : 'bg-white text-gray-700 border'
            }`}
            style={typeFilter === t ? { backgroundColor: markerColour(t) } : {}}
          >
            {alertLabel(t)}
          </button>
        ))}
      </div>

      {/* Map container */}
      <div ref={containerRef} className="flex-1" style={{ minHeight: 0 }} />

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-[999]">
          <span className="text-sm text-gray-600">Loading alerts…</span>
        </div>
      )}

      {/* Bottom sheet */}
      {selected && (
        <div className="absolute bottom-0 left-0 right-0 z-[1001] bg-white dark:bg-gray-900 rounded-t-2xl shadow-xl p-4 max-h-72 overflow-y-auto">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span
                className="inline-block px-2 py-0.5 rounded text-xs font-semibold text-white mb-1"
                style={{ backgroundColor: markerColour(selected.type) }}
              >
                {alertLabel(selected.type)}
              </span>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {selected.plate ?? selected.vin ?? 'Unknown vehicle'}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">{timeAgo(selected.createdAt)}</p>
            </div>
            <button
              onClick={() => setSelected(null)}
              className="text-gray-400 hover:text-gray-600 text-xl leading-none mt-0.5"
            >
              ×
            </button>
          </div>
          {selected.description && (
            <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">{selected.description}</p>
          )}
          {selected.plate && (
            <a
              href={`/search?q=${selected.plate}`}
              className="mt-3 inline-block text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              View vehicle report →
            </a>
          )}
        </div>
      )}
    </div>
  );
}
