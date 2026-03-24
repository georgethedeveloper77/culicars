'use client';
// apps/web/src/components/shared/SearchBar.tsx

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

interface SearchBarProps {
  defaultValue?: string;
  size?: 'default' | 'large';
  placeholder?: string;
  autoFocus?: boolean;
}

export function SearchBar({
  defaultValue = '',
  size = 'default',
  placeholder = 'Enter plate e.g. KCA 123A or VIN',
  autoFocus = false,
}: SearchBarProps) {
  const [query, setQuery] = useState(defaultValue);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  const isLarge = size === 'large';

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className={`flex gap-2 ${isLarge ? 'flex-col sm:flex-row' : ''}`}>
        <div className="relative flex-1">
          {/* Plate icon */}
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
            <span className="text-cc-muted text-sm">🔍</span>
          </div>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value.toUpperCase())}
            placeholder={placeholder}
            autoFocus={autoFocus}
            className={`cc-input pl-10 font-mono tracking-wider ${
              isLarge ? 'text-base py-4' : ''
            }`}
            aria-label="Search plate or VIN"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className={`cc-btn-primary whitespace-nowrap ${isLarge ? 'py-4 px-8 text-base' : ''}`}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Searching…
            </span>
          ) : 'Search'}
        </button>
      </div>
      <p className="text-cc-faint text-xs mt-2 pl-1">
        Kenya plates: KCA 123A · VIN: 17 characters · GK / CD / UN plates supported
      </p>
    </form>
  );
}
