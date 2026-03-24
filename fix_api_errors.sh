#!/bin/bash
# Run from monorepo root: bash fix_api_errors.sh
set -e
API="apps/api/src"

echo "=== 1. Router type annotations ==="
for f in \
  "$API/routes/contributions.ts" \
  "$API/routes/credits.ts" \
  "$API/routes/health.ts" \
  "$API/routes/ntsa.ts" \
  "$API/routes/ocr.ts" \
  "$API/routes/payments.ts" \
  "$API/routes/reports.ts" \
  "$API/routes/scraper.ts" \
  "$API/routes/search.ts" \
  "$API/routes/stolen.ts" \
  "$API/routes/webhooks/mpesa.ts" \
  "$API/routes/webhooks/paypal.ts" \
  "$API/routes/webhooks/revenuecat.ts" \
  "$API/routes/webhooks/stripe.ts"; do
  sed -i '' 's/const router = Router()/const router: import("express").Router = Router()/g' "$f"
done

echo "=== 2. stripe.ts: STRIPE_WEBHOOK_SECRET non-null ==="
sed -i '' 's/env\.STRIPE_WEBHOOK_SECRET)/env.STRIPE_WEBHOOK_SECRET!)/g' \
  "$API/routes/webhooks/stripe.ts"

echo "=== 3. ntsa.ts: NormalizedPlate → .normalized ==="
sed -i '' 's/plate: normalizedPlate,/plate: normalizedPlate.normalized,/g' \
  "$API/routes/ntsa.ts"

echo "=== 4. scheduledScrape.ts: remove ScraperSource import ==="
sed -i '' 's/import { runScraper, ScraperSource }/import { runScraper }/g' \
  "$API/jobs/scheduledScrape.ts"

echo "=== 5. ledgerService.ts: fix PrismaClient import ==="
sed -i '' "s/import type { PrismaClient } from '@culicars\/database';/import type { PrismaClient } from '@prisma\/client';/" \
  "$API/services/ledgerService.ts"

echo "=== 6. walletService.ts: fix PrismaClient+Prisma import ==="
sed -i '' "s/import type { PrismaClient, Prisma } from '@culicars\/database';/import type { PrismaClient, Prisma } from '@prisma\/client';/" \
  "$API/services/walletService.ts"

echo "=== 7. autochekScraper.ts: json unknown type ==="
python3 - << 'PYEOF'
path = "apps/api/src/services/scrapers/autochekScraper.ts"
with open(path) as f:
    c = f.read()
c = c.replace(
    "const cars: Record<string, unknown>[] = json.result ?? json.data ?? [];",
    "const cars: Record<string, unknown>[] = (json as any).result ?? (json as any).data ?? [];"
)
with open(path, "w") as f:
    f.write(c)
print("autochekScraper fixed")
PYEOF

echo "=== 8. baseScraper.ts: createMany snake_case fields ==="
sed -i '' \
  -e 's/job_id: /jobId: /g' \
  -e 's/raw_data: /rawData: /g' \
  "$API/services/scrapers/baseScraper.ts"

echo "=== 9. rawDataProcessor.ts: snake_case → camelCase ==="
python3 - << 'PYEOF'
path = "apps/api/src/processors/rawDataProcessor.ts"
with open(path) as f:
    c = f.read()
replacements = [
    ("job_id: jobId",       "jobId: jobId"),
    ("{ job_id:",           "{ jobId:"),
    ("created_at: 'asc'",   "createdAt: 'asc'"),
    ("row.raw_data",        "row.rawData"),
    ("processed_at: new Date()", "processedAt: new Date()"),
    ("by: ['job_id']",      "by: ['jobId']"),
    ("const { job_id }",    "const { jobId }"),
    ("(job_id)",            "(jobId)"),
]
for old, new in replacements:
    c = c.replace(old, new)
with open(path, "w") as f:
    f.write(c)
print("rawDataProcessor fixed")
PYEOF

echo "=== 10. vehicleProcessor.ts: snake_case → camelCase ==="
python3 - << 'PYEOF'
path = "apps/api/src/processors/vehicleProcessor.ts"
with open(path) as f:
    c = f.read()
replacements = [
    ("engine_cc:",                 "engineCc:"),
    ("existing.japan_auction_grade",  "existing.japanAuctionGrade"),
    ("existing.japan_auction_mileage","existing.japanAuctionMileage"),
    ("data.japan_auction_mileage",    "data.japanAuctionMileage"),
]
for old, new in replacements:
    c = c.replace(old, new)
with open(path, "w") as f:
    f.write(c)
print("vehicleProcessor fixed")
PYEOF

echo "=== 11. plateProcessor.ts: snake_case + null safety ==="
python3 - << 'PYEOF'
path = "apps/api/src/processors/plateProcessor.ts"
with open(path) as f:
    c = f.read()
replacements = [
    ("source: data.source,",        "source: data.source as any,"),
    ("existing.verified_at",         "existing.verifiedAt"),
    ("verified_at:",                 "verifiedAt:"),
    ("if (data.confidence > existing.confidence)", 
     "if (data.confidence > (existing.confidence ?? 0))"),
]
for old, new in replacements:
    c = c.replace(old, new)
with open(path, "w") as f:
    f.write(c)
print("plateProcessor fixed")
PYEOF

echo "=== 12. eventProcessor.ts: source + metadata type ==="
python3 - << 'PYEOF'
path = "apps/api/src/processors/eventProcessor.ts"
with open(path) as f:
    c = f.read()
c = c.replace("source: data.source,", "source: data.source as any,")
c = c.replace("metadata: data.metadata ?? {}", "metadata: (data.metadata ?? {}) as any")
with open(path, "w") as f:
    f.write(c)
print("eventProcessor fixed")
PYEOF

echo "=== 13. contributionService.ts: snake_case + type fixes ==="
python3 - << 'PYEOF'
path = "apps/api/src/services/contributionService.ts"
with open(path) as f:
    c = f.read()
replacements = [
    ("data: submission.data ?? {}",      "data: (submission.data ?? {}) as any"),
    ("created_at: 'desc'",               "createdAt: 'desc'"),
    ("admin_note:",                       "adminNote:"),
    ("updated.evidence_urls",            "updated.evidenceUrls"),
    ("updated.confidence_score",         "updated.confidenceScore"),
]
for old, new in replacements:
    c = c.replace(old, new)
with open(path, "w") as f:
    f.write(c)
print("contributionService fixed")
PYEOF

echo "=== 14. enrichmentService.ts: event_type + metadata ==="
python3 - << 'PYEOF'
import re
path = "apps/api/src/services/enrichmentService.ts"
with open(path) as f:
    c = f.read()
c = c.replace("event_type: ", "eventType: ")
# Fix all: metadata: data ?? {} and metadata: {} blocks
c = re.sub(r'metadata: (data \?\? \{\})', r'metadata: (\1) as any', c)
c = re.sub(r'metadata: \{$', 'metadata: ({', c, flags=re.MULTILINE)
# Fix closing of metadata object blocks: },\n  => }) as any,
c = re.sub(r'(metadata: \(\{[^}]+\}),', r'\1) as any,', c, flags=re.DOTALL)
with open(path, "w") as f:
    f.write(c)
print("enrichmentService fixed")
PYEOF

echo "=== 15. stolenReportService.ts: event_type + metadata ==="
python3 - << 'PYEOF'
import re
path = "apps/api/src/services/stolenReportService.ts"
with open(path) as f:
    c = f.read()
c = c.replace("event_type: ", "eventType: ")
c = re.sub(r'metadata: \{$', 'metadata: ({', c, flags=re.MULTILINE)
c = re.sub(r'(metadata: \(\{[^}]+\}),', r'\1) as any,', c, flags=re.DOTALL)
with open(path, "w") as f:
    f.write(c)
print("stolenReportService fixed")
PYEOF

echo "=== 16. paymentProviderService.ts: providerMeta type ==="
sed -i '' \
  -e 's/providerMeta: result\.providerData ?? undefined/providerMeta: (result.providerData ?? undefined) as any/g' \
  -e 's/providerMeta: providerMeta ?? undefined/providerMeta: (providerMeta ?? undefined) as any/g' \
  "$API/services/paymentProviderService.ts"

echo "=== 17. scraperJobService.ts: snake_case interface fields ==="
python3 - << 'PYEOF'
path = "apps/api/src/services/scraperJobService.ts"
with open(path) as f:
    c = f.read()
replacements = [
    ("created_at: Date;",    "createdAt: Date;"),
    ("error_log:",           "errorLog:"),
    ("started_at:",          "startedAt:"),
    ("items_found",          "itemsFound"),
    ("items_stored",         "itemsStored"),
    ("items_skipped",        "itemsSkipped"),
    ("created_at: 'desc'",   "createdAt: 'desc'"),
]
for old, new in replacements:
    c = c.replace(old, new)
with open(path, "w") as f:
    f.write(c)
print("scraperJobService fixed")
PYEOF

echo "=== 18. scraperOrchestrator.ts: snake_case + registry type ==="
python3 - << 'PYEOF'
import re
path = "apps/api/src/services/scraperOrchestrator.ts"
with open(path) as f:
    c = f.read()
c = c.replace("started_at: new Date()", "startedAt: new Date()")
c = c.replace(
    "{ items_found, items_stored, items_skipped }",
    "{ itemsFound: items_found, itemsStored: items_stored, itemsSkipped: items_skipped }"
)
# Fix map type — cast to any to avoid scraper union type mismatch
c = c.replace(
    "const SCRAPER_REGISTRY: Map<ScraperSource, ScraperFactory> = new Map([",
    "const SCRAPER_REGISTRY: Map<ScraperSource, ScraperFactory> = new Map(["
)
# Add 'as any' to the Map constructor call to bypass union type issue
c = re.sub(
    r'const SCRAPER_REGISTRY: Map<ScraperSource, ScraperFactory> = new Map\(\[',
    'const SCRAPER_REGISTRY = new Map<ScraperSource, ScraperFactory>([',
    c
)
with open(path, "w") as f:
    f.write(c)
print("scraperOrchestrator fixed")
PYEOF

echo "=== 19. searchService.ts: StolenAlert type ==="
python3 - << 'PYEOF'
import re
path = "apps/api/src/services/searchService.ts"
with open(path) as f:
    c = f.read()
c = re.sub(
    r'stolenAlert = await (check\w+)\(([^)]+)\);',
    r'stolenAlert = await \1(\2) as any;',
    c
)
with open(path, "w") as f:
    f.write(c)
print("searchService fixed")
PYEOF

echo "=== 20. vinExtractor.ts: isValid type ==="
python3 - << 'PYEOF'
path = "apps/api/src/services/vinExtractor.ts"
with open(path) as f:
    c = f.read()
# isValid should be validation.valid (boolean), not the whole VinValidation object
c = c.replace("isValid,", "isValid: validation.valid,")
with open(path, "w") as f:
    f.write(c)
print("vinExtractor fixed")
PYEOF

echo ""
echo "=== All fixes applied! Now run: pnpm --filter @culicars/api build ==="
