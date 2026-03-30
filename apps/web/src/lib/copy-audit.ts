// apps/web/src/lib/copy-audit.ts
// T16 Polish — Language Rules Enforcement
//
// This file is NOT imported at runtime.
// It documents the canonical copy substitutions to apply across all UI surfaces.
//
// Run the audit script below to find remaining violations:
//   grep -rn --include="*.tsx" --include="*.ts" \
//     -e "scraping\|scraped\|scraper\|NTSA card\|no data found\|raw data\|ownership shown" \
//     apps/web/src apps/admin/src apps/mobile/lib
//
// Forbidden → Canonical replacements:
// ─────────────────────────────────────────────────────────────────────────
// "scraping"            → "data source" / "data job" / "data ingestion"
// "scraped data"        → "analyzed vehicle data" / "vehicle records"
// "scraper"             → "data source adapter"
// "no data found"       → "no records available for this vehicle yet"
// "NTSA card"           → "Verify owner" / "Verify official record"
// "raw data"            → "analyzed vehicle data"
// "ownership shown by default" → "ownership shown only after verification"
// "no result"           → "no records available yet"
// ─────────────────────────────────────────────────────────────────────────

export const COPY = {
  // Search result states
  noRecords: 'No records available for this vehicle yet.',
  pending: 'Vehicle added to our records. Check back soon.',
  lowConfidence: 'Limited information available. Verify the official record for full details.',
  partial: 'Some information is available. Unlock the full report for complete details.',

  // Ownership
  ownershipPrompt: 'Verify owner',
  ownershipCTA: 'Verify official record',
  ownershipUnverified: 'Ownership not confirmed',
  ownershipVerified: 'Ownership verified',
  ownershipSubtext: 'Verify the official record to confirm current ownership details.',
  ownershipNeverShownBeforeVerification:
    'Ownership details are only shown after completing official verification.',

  // Report sections
  reportNotUnlocked: 'Unlock the full report to view this section.',
  communityInsightsEmpty: 'No community reports for this vehicle yet.',
  communityInsightsLoading: 'Loading community intelligence…',

  // Data job language (admin only)
  dataJobRunning: 'Data source running…',
  dataJobSuccess: 'Records updated successfully.',
  dataJobFailed: 'Data source run failed. Review the error log.',
  dataJobDisabled: 'Data source is currently disabled.',

  // Watch / alerts
  noAlerts: 'No watch alerts in this area yet.',
  alertPending: 'Alert pending review.',
  alertApproved: 'Alert verified by moderators.',
  alertRejected: 'Alert removed from feed.',

  // Contributions
  contributionPending: 'Contribution submitted. Under review.',
  contributionApproved: 'Contribution verified and added to report.',
  contributionRejected: 'Contribution was not approved.',
  contributionNeedsMoreInfo: 'Additional information required.',

  // Payments / credits
  creditsAdded: 'Credits added to your account.',
  paymentFailed: 'Payment could not be completed. Please try again.',
  reportUnlocked: 'Report unlocked.',

  // Empty states
  myVehiclesEmpty: 'No vehicles added yet. Search for a vehicle to get started.',
  watchlistEmpty: 'Your watchlist is empty.',
  notificationsEmpty: 'No notifications yet.',
  savedReportsEmpty: 'No saved reports. Search for a vehicle to create your first report.',
} as const;

// ─────────────────────────────────────────────────────────────────────────
// T16 Empty State Checklist
// Every route must handle: loading | empty | error | content
// ─────────────────────────────────────────────────────────────────────────
//
// Web routes and their required states:
// /                        loading skeleton | hero with search
// /search                  loading | results | no records available
// /report/[id]             loading | partial shell | full | locked preview
// /report/[id]/contribute  loading | form | done | error
// /verify                  intro | uploading | processing | done | error
// /watch/feed              loading | alerts | no alerts
// /watch/map               loading | map with pins | no alerts in area
// /watch/insights          loading | stats | no data yet
// /watch/report/vehicle    form | done | error
// /watch/report/area       form | done | error
// /dashboard               loading | vehicles | empty
// /notifications           loading | list | empty
// /pricing                 static (no dynamic state)
//
// Mobile screens:
// SearchScreen             loading | results | no records | error
// ReportFullScreen         loading | locked | partial | full
// WatchFeedScreen          loading | feed | empty
// WatchMapScreen           loading | map | no pins
// MyVehiclesScreen         loading | list | empty
// NotificationsScreen      loading | list | empty
// PaymentScreen            loading | options | processing | done | error
//
// ─────────────────────────────────────────────────────────────────────────
// T16 Dark Mode Checklist
// ─────────────────────────────────────────────────────────────────────────
// All new components in T13–T15 use Tailwind CSS variables (bg-background,
// text-foreground, text-muted-foreground, border-border) — no hardcoded
// hex colors in className. Dark mode handled by root class="dark".
//
// Verify in browser: chrome://flags/#force-dark-mode or system dark mode.
// Flutter: ThemeMode.system — all colors must reference ColorScheme.*
//
// ─────────────────────────────────────────────────────────────────────────
// T16 Role Access Final Audit
// ─────────────────────────────────────────────────────────────────────────
// admin:    all routes
// employee: /watch/queue, /contributions/queue, /analytics (no /settings/*)
// user:     /report, /verify, /contribute, /watch/feed, /dashboard
//
// Employee CANNOT reach:
//   /settings/payments    ← requireRole(['admin'])
//   /settings/web         ← requireRole(['admin'])
//   /settings/app         ← requireRole(['admin'])
//   /data-sources/:id     ← requireRole(['admin'])
//   DELETE /watch/alerts  ← no delete routes exist (immutable records)
//   DELETE /contributions ← no delete routes exist (immutable records)
