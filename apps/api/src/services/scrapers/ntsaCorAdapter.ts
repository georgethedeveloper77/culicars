// apps/api/src/services/scrapers/ntsaCorAdapter.ts

import { ScraperAdapter } from './adapter.interface';
import { NormalisedRecord } from '../../types/result.types';
import { prisma } from '@culicars/database';

export class NtsaCorAdapter implements ScraperAdapter {
  readonly sourceName = 'ntsa_cor';

  isEnabled(): boolean { return true; }

  async fetchByVin(vin: string): Promise<NormalisedRecord | null> {
    return this._query({ vin });
  }

  async fetchByPlate(plate: string): Promise<NormalisedRecord | null> {
    return this._query({ plate });
  }

  private async _query(filter: { vin?: string; plate?: string }): Promise<NormalisedRecord | null> {
    try {
      const raw = await prisma.raw_records.findFirst({
        where: {
          source: this.sourceName,
          ...(filter.vin   ? { vin: filter.vin }     : {}),
          ...(filter.plate ? { plate: filter.plate } : {}),
        },
        orderBy: { created_at: 'desc' },
      });

      if (!raw) return null;
      const data = (raw.normalised_json ?? {}) as Record<string, unknown>;

      return {
        vin:              raw.vin,
        plate:            raw.plate,
        make:             (data.make             as string) ?? null,
        model:            (data.model            as string) ?? null,
        year:             (data.year             as number) ?? null,
        engineCapacity:   (data.engineCapacity   as string) ?? null,
        fuelType:         (data.fuelType         as string) ?? null,
        color:            (data.color            as string) ?? null,
        bodyType:         (data.bodyType         as string) ?? null,
        transmissionType: (data.transmissionType as string) ?? null,
        registrationDate: (data.registrationDate as string) ?? null,
        importDate:       null,
        mileage:          null,
        mileageUnit:      null,
        auctionGrade:     null,
        sourceId:         (raw.source_id as string) ?? raw.id,
        sourceName:       this.sourceName,
        confidence:       1.0,
        fetchedAt:        raw.created_at?.toISOString() ?? new Date().toISOString(),
      };
    } catch (err) {
      console.error(JSON.stringify({ msg: 'NtsaCorAdapter query failed', err: String(err), filter }));
      return null;
    }
  }
}
