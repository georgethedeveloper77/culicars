"use strict";
// apps/api/src/services/scrapers/beForwardAdapter.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.BeForwardAdapter = void 0;
const database_1 = require("@culicars/database");
class BeForwardAdapter {
    constructor() {
        this.sourceName = 'be_forward';
    }
    isEnabled() { return true; }
    async fetchByVin(vin) {
        return this._query({ vin });
    }
    async fetchByPlate(_plate) {
        return null;
    }
    async _query(filter) {
        try {
            const raw = await database_1.prisma.raw_records.findFirst({
                where: { source: this.sourceName, ...filter },
                orderBy: { created_at: 'desc' },
            });
            if (!raw)
                return null;
            const data = (raw.normalised_json ?? {});
            return {
                vin: raw.vin,
                plate: raw.plate,
                make: data.make ?? null,
                model: data.model ?? null,
                year: data.year ?? null,
                engineCapacity: data.engineCapacity ?? null,
                fuelType: data.fuelType ?? null,
                color: data.color ?? null,
                bodyType: data.bodyType ?? null,
                transmissionType: data.transmissionType ?? null,
                registrationDate: null,
                importDate: data.importDate ?? null,
                mileage: data.mileage ?? null,
                mileageUnit: data.mileageUnit ?? 'km',
                auctionGrade: data.auctionGrade ?? null,
                sourceId: raw.source_id ?? raw.id,
                sourceName: this.sourceName,
                confidence: 0.85,
                fetchedAt: raw.created_at?.toISOString() ?? new Date().toISOString(),
            };
        }
        catch (err) {
            console.error(JSON.stringify({ msg: 'BeForwardAdapter query failed', err: String(err), filter }));
            return null;
        }
    }
}
exports.BeForwardAdapter = BeForwardAdapter;
