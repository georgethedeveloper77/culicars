#!/bin/bash
# Run from monorepo root: bash fix_api_errors4.sh
API="apps/api/src"

echo "=== 1. auctionProcessor.ts + listingProcessor.ts + serviceRecordProcessor.ts: event_date → eventDate ==="
for f in \
  "$API/processors/auctionProcessor.ts" \
  "$API/processors/listingProcessor.ts" \
  "$API/processors/serviceRecordProcessor.ts"; do
  sed -i '' 's/event_date:/eventDate:/g' "$f"
done

echo "=== 2. eventProcessor.ts: fix EventCandidate interface + data access ==="
python3 - << 'PYEOF'
path = "apps/api/src/processors/eventProcessor.ts"
with open(path) as f:
    c = f.read()

# EventCandidate interface uses event_type (snake) — revert eventType back to event_type in the candidate object
c = c.replace("eventType: data.eventType,", "event_type: data.eventType,")

# VehicleEventData interface uses source_ref (snake) — revert sourceRef back
c = c.replace("sourceRef: data.sourceRef,", "source_ref: data.sourceRef,")
c = c.replace("sourceRef: data.sourceRef ?? null,", "source_ref: data.sourceRef ?? null,")

# data.sourceRef doesn't exist on VehicleEventData (it's source_ref there)
c = c.replace("data.sourceRef", "data.source_ref")

# eventType on Prisma create needs cast
c = c.replace(
    "eventType: data.eventType,",
    "eventType: data.eventType as any,"
)

with open(path, "w") as f:
    f.write(c)
print("eventProcessor fixed")
PYEOF

echo "=== 3. vehicleProcessor.ts: bodyType → body_type read, countryOfOrigin fix ==="
python3 - << 'PYEOF'
path = "apps/api/src/processors/vehicleProcessor.ts"
with open(path) as f:
    c = f.read()
# data.bodyType doesn't exist on VehicleData (it's body_type) — revert read
c = c.replace("bodyType: data.bodyType ?? null", "bodyType: data.body_type ?? null")
# country_of_origin Prisma field → countryOfOrigin
c = c.replace("country_of_origin:", "countryOfOrigin:")
with open(path, "w") as f:
    f.write(c)
print("vehicleProcessor fixed")
PYEOF

echo "=== 4. contributionService.ts: verification_doc_urls → verificationDocUrls ==="
sed -i '' 's/verification_doc_urls:/verificationDocUrls:/g' \
  "$API/services/contributionService.ts"

echo ""
echo "=== Done! Run: pnpm --filter @culicars/api build ==="
