"use strict";
// apps/api/src/services/scrapers/ntsaCorAdapter.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.NtsaCorAdapter = void 0;
const database_1 = require("@culicars/database");
class NtsaCorAdapter {
    constructor() {
        this.sourceName = 'ntsa_cor';
    }
    isEnabled() { return true; }
    async fetchByVin(vin) {
        return this._query({ vin });
    }
    async fetchByPlate(plate) {
        return this._query({ plate });
    }
    async _query(filter) {
        try {
            const raw = await database_1.prisma.raw_records.findFirst({
                where: {
                    source: this.sourceName,
                    ...(filter.vin ? { vin: filter.vin } : {}),
                    ...(filter.plate ? { plate: filter.plate } : {}),
                },
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
                registrationDate: data.registrationDate ?? null,
                importDate: null,
                mileage: null,
                mileageUnit: null,
                auctionGrade: null,
                sourceId: raw.source_id ?? raw.id,
                sourceName: this.sourceName,
                confidence: 1.0,
                fetchedAt: raw.created_at?.toISOString() ?? new Date().toISOString(),
            };
        }
        catch (err) {
            console.error(JSON.stringify({ msg: 'NtsaCorAdapter query failed', err: String(err), filter }));
            return null;
        }
    }
}
exports.NtsaCorAdapter = NtsaCorAdapter;
