// apps/api/src/services/scrapers/beForwardAdapter.ts

import { ScraperAdapter } from './adapter.interface';
import { NormalisedRecord } from '../../types/result.types';
import { prisma } from '@culicars/database';

export class BeForwardAdapter implements ScraperAdapter {
  readonly sourceName = 'be_forward';

  isEnabled(): boolean { return true; }

  async fetchByVin(vin: string): Promise<NormalisedRecord | null> {
    return this._query({ vin });
  }

  async fetchByPlate(_plate: string): Promise<NormalisedRecord | null> {
    return null;
  }

  private async _query(filter: { vin?: string }): Promise<NormalisedRecord | null> {
    try {
      const raw = await prisma.raw_records.findFirst({
        where: { source: this.sourceName, ...filter },
        orderBy: { created_at: 'desc' },
      });

      if (!raw) return null;
      const data = (raw.normalised_json ?? {}) as Record<string, unknown>;

      return {
        vin:              raw.vin,
        plate:            raw.plate,
        make:             (data.make             as string)       ?? null,
        model:            (data.model            as string)       ?? null,
        year:             (data.year             as number)       ?? null,
        engineCapacity:   (data.engineCapacity   as string)       ?? null,
        fuelType:         (data.fuelType         as string)       ?? null,
        color:            (data.color            as string)       ?? null,
        bodyType:         (data.bodyType         as string)       ?? null,
        transmissionType: (data.transmissionType as string)       ?? null,
        registrationDate: null,
        importDate:       (data.importDate       as string)       ?? null,
        mileage:          (data.mileage          as number)       ?? null,
        mileageUnit:      (data.mileageUnit      as 'km' | 'mi') ?? 'km',
        auctionGrade:     (data.auctionGrade     as string)       ?? null,
        sourceId:         (raw.source_id as string) ?? raw.id,
        sourceName:       this.sourceName,
        confidence:       0.85,
        fetchedAt:        raw.created_at?.toISOString() ?? new Date().toISOString(),
      };
    } catch (err) {
      console.error(JSON.stringify({ msg: 'BeForwardAdapter query failed', err: String(err), filter }));
      return null;
    }
  }
}
