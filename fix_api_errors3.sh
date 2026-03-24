#!/bin/bash
# Run from monorepo root: bash fix_api_errors3.sh
API="apps/api/src"

echo "=== 1. scheduledScrape.ts: import ScraperSource from scraperJobService directly ==="
python3 - << 'PYEOF'
path = "apps/api/src/jobs/scheduledScrape.ts"
with open(path) as f:
    c = f.read()
# Remove ScraperSource from scraperOrchestrator import, add separate import
c = c.replace(
    "import { runScraper, ScraperSource } from '../services/scraperOrchestrator';",
    "import { runScraper } from '../services/scraperOrchestrator';\nimport type { ScraperSource } from '../services/scraperJobService';"
)
with open(path, "w") as f:
    f.write(c)
print("scheduledScrape fixed")
PYEOF

echo "=== 2. eventProcessor.ts: fix data.event_type → data.eventType, data.event_date → data.eventDate, source_ref → sourceRef ==="
python3 - << 'PYEOF'
path = "apps/api/src/processors/eventProcessor.ts"
with open(path) as f:
    c = f.read()
c = c.replace("data.event_type", "data.eventType")
c = c.replace("data.event_date", "data.eventDate")
c = c.replace("source_ref:", "sourceRef:")
c = c.replace("data.source_ref", "data.sourceRef")
with open(path, "w") as f:
    f.write(c)
print("eventProcessor fixed")
PYEOF

echo "=== 3. auctionProcessor.ts + listingProcessor.ts + serviceRecordProcessor.ts: event_type → eventType ==="
for f in \
  "$API/processors/auctionProcessor.ts" \
  "$API/processors/listingProcessor.ts" \
  "$API/processors/serviceRecordProcessor.ts"; do
  sed -i '' 's/event_type:/eventType:/g' "$f"
  sed -i '' 's/plate_display:/plateDisplay:/g' "$f"
done

echo "=== 4. vehicleProcessor.ts: data.fuelType → data.fuel_type, body_type → bodyType ==="
python3 - << 'PYEOF'
path = "apps/api/src/processors/vehicleProcessor.ts"
with open(path) as f:
    c = f.read()
# The interface uses fuel_type, so read from data.fuel_type
c = c.replace("fuelType: data.fuelType ?? null", "fuelType: data.fuel_type ?? null")
c = c.replace("body_type:", "bodyType:")
c = c.replace("data.body_type", "data.bodyType")
with open(path, "w") as f:
    f.write(c)
print("vehicleProcessor fixed")
PYEOF

echo "=== 5. contributionService.ts: evidence_urls → evidenceUrls, reviewed_at → reviewedAt ==="
sed -i '' \
  -e 's/evidence_urls:/evidenceUrls:/g' \
  -e 's/reviewed_at:/reviewedAt:/g' \
  "$API/services/contributionService.ts"

echo "=== 6. enrichmentService.ts + stolenReportService.ts: source_ref → sourceRef ==="
for f in \
  "$API/services/enrichmentService.ts" \
  "$API/services/stolenReportService.ts"; do
  sed -i '' 's/source_ref:/sourceRef:/g' "$f"
done

echo "=== 7. baseScraper.ts: rawData type cast ==="
sed -i '' 's/rawData: item\.rawData,/rawData: item.rawData as any,/g' \
  "$API/services/scrapers/baseScraper.ts"
# Also fix the createMany data array
python3 - << 'PYEOF'
path = "apps/api/src/services/scrapers/baseScraper.ts"
with open(path) as f:
    c = f.read()
c = c.replace(
    "const result = await prisma.scraperDataRaw.createMany({ data });",
    "const result = await prisma.scraperDataRaw.createMany({ data: data as any });"
)
with open(path, "w") as f:
    f.write(c)
print("baseScraper fixed")
PYEOF

echo "=== 8. vinExtractor.ts: fix isValid reference ==="
python3 - << 'PYEOF'
path = "apps/api/src/services/vinExtractor.ts"
with open(path) as f:
    c = f.read()
# isValid is already declared as const isValid = validateVin(cleaned)
# so just use isValid.valid
c = c.replace("isValid: isValidVin(extracted),", "isValid: isValid.valid,")
with open(path, "w") as f:
    f.write(c)
print("vinExtractor fixed")
PYEOF

echo ""
echo "=== Done! Run: pnpm --filter @culicars/api build ==="
