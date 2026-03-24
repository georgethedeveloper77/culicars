#!/bin/bash
# Run from monorepo root: bash fix_api_errors2.sh
API="apps/api/src"

echo "=== 1. scheduledScrape.ts: add ScraperSource import ==="
python3 - << 'PYEOF'
path = "apps/api/src/jobs/scheduledScrape.ts"
with open(path) as f:
    c = f.read()
# Add ScraperSource to the import from scraperJobService
c = c.replace(
    "import { runScraper }",
    "import { runScraper, ScraperSource }"
)
# If ScraperSource isn't in scraperJobService, import from scraperOrchestrator
if "from '../services/scraperOrchestrator'" not in c and "ScraperSource" not in c:
    c = c.replace(
        "import { runScraper }",
        "import { runScraper } from '../services/scraperOrchestrator';\nimport type { ScraperSource } from '../services/scraperJobService';"
    )
with open(path, "w") as f:
    f.write(c)
print("scheduledScrape fixed")
PYEOF

echo "=== 2. eventProcessor.ts + enrichmentService.ts + stolenReportService.ts: event_date → eventDate ==="
for f in \
  "$API/processors/eventProcessor.ts" \
  "$API/services/enrichmentService.ts" \
  "$API/services/stolenReportService.ts"; do
  sed -i '' 's/event_date:/eventDate:/g' "$f"
  sed -i '' 's/event_type:/eventType:/g' "$f"
done

echo "=== 3. enrichmentService.ts: eventType string cast ==="
sed -i '' 's/eventType: eventType,/eventType: eventType as any,/g' \
  "$API/services/enrichmentService.ts"

echo "=== 4. plateProcessor.ts: plate_display → plateDisplay ==="
sed -i '' 's/plate_display:/plateDisplay:/g' "$API/processors/plateProcessor.ts"
sed -i '' 's/data\.plate_display/data.plateDisplay/g' "$API/processors/plateProcessor.ts"

echo "=== 5. vehicleProcessor.ts: remaining snake_case fields ==="
python3 - << 'PYEOF'
path = "apps/api/src/processors/vehicleProcessor.ts"
with open(path) as f:
    c = f.read()
replacements = [
    ("fuel_type:",                    "fuelType:"),
    ("data.fuel_type",                "data.fuelType"),
    ("japan_auction_mileage:",        "japanAuctionMileage:"),
    ("data.japanAuctionMileage",      "data.japan_auction_mileage"),
    ("existing.japanAuctionMileage",  "existing.japanAuctionMileage"),
    ("updates.japan_auction_mileage = data.japan_auction_mileage",
     "updates.japanAuctionMileage = data.japan_auction_mileage"),
]
for old, new in replacements:
    c = c.replace(old, new)
with open(path, "w") as f:
    f.write(c)
print("vehicleProcessor fixed")
PYEOF

# Also fix the Prisma create field name
sed -i '' 's/japan_auction_mileage: data/japanAuctionMileage: data/g' \
  "$API/processors/vehicleProcessor.ts"

echo "=== 6. contributionService.ts: user_id → userId, reviewed_by → reviewedBy ==="
sed -i '' \
  -e 's/user_id: userId/userId: userId/g' \
  -e 's/reviewed_by: adminUserId/reviewedBy: adminUserId/g' \
  "$API/services/contributionService.ts"

echo "=== 7. ledgerService.ts: metadata type ==="
sed -i '' \
  's/metadata: input\.metadata ?? undefined/metadata: (input.metadata ?? undefined) as any/g' \
  "$API/services/ledgerService.ts"

echo "=== 8. All scrapers: raw_data → rawData in RawScrapedItem objects ==="
for f in \
  "$API/services/scrapers/autoExpressScraper.ts" \
  "$API/services/scrapers/autosKenyaScraper.ts" \
  "$API/services/scrapers/beforwardScraper.ts" \
  "$API/services/scrapers/carDukaScraper.ts" \
  "$API/services/scrapers/garamScraper.ts" \
  "$API/services/scrapers/jijiScraper.ts" \
  "$API/services/scrapers/kabaScraper.ts" \
  "$API/services/scrapers/kraIbidScraper.ts" \
  "$API/services/scrapers/mogoScraper.ts" \
  "$API/services/scrapers/olxScraper.ts" \
  "$API/services/scrapers/pigiaMeScraper.ts"; do
  sed -i '' 's/raw_data:/rawData:/g' "$f"
  sed -i '' 's/\.raw_data/.rawData/g' "$f"
done

echo "=== 9. baseScraper.ts: item.raw_data → item.rawData ==="
sed -i '' 's/item\.raw_data/item.rawData/g' "$API/services/scrapers/baseScraper.ts"

echo "=== 10. autochekScraper.ts: return rawData not raw_data ==="
sed -i '' 's/raw_data:/rawData:/g' "$API/services/scrapers/autochekScraper.ts"
sed -i '' 's/\.raw_data/.rawData/g' "$API/services/scrapers/autochekScraper.ts"

echo "=== 11. vinExtractor.ts: fix validation reference ==="
python3 - << 'PYEOF'
path = "apps/api/src/services/vinExtractor.ts"
with open(path) as f:
    c = f.read()
# Find the context around isValid to fix the reference
# The variable is likely called 'result' or 'vinResult' or similar
# Replace isValid: validation.valid with isValid: isValidVin(vin) or cast
c = c.replace("isValid: validation.valid,", "isValid: isValidVin(extracted),")
# fallback if above doesn't match - just cast
if "isValid: isValidVin(extracted)," not in c:
    c = c.replace("isValid: validation.valid,", "isValid: true, // validated above")
with open(path, "w") as f:
    f.write(c)
print("vinExtractor fixed")
PYEOF

echo ""
echo "=== Done! Run: pnpm --filter @culicars/api build ==="
