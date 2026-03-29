// apps/admin/src/app/settings/page.tsx
'use client';

import Link from 'next/link';

const sections = [
  {
    href: '/settings/payments',
    label: 'Payments & Packs',
    description: 'Enable providers, configure credit packs per platform',
  },
  {
    href: '/settings/web',
    label: 'Web Config',
    description: 'Hero headline and subtext for culicars.com',
  },
  {
    href: '/settings/app',
    label: 'App Config',
    description: 'Onboarding copy and feature flags for mobile',
  },
  {
    href: '/watch/settings',
    label: 'Watch Settings',
    description: 'Approval mode, alert expiry, public visibility rules',
  },
];

export default function SettingsPage() {
  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-2">Platform Settings</h1>
      <p className="text-gray-400 text-sm mb-8">
        Changes take effect immediately — no redeploy required.
      </p>
      <div className="space-y-3">
        {sections.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="block border border-gray-700 rounded-lg p-4 hover:border-gray-500 transition-colors"
          >
            <div className="font-medium">{s.label}</div>
            <div className="text-sm text-gray-400 mt-1">{s.description}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
