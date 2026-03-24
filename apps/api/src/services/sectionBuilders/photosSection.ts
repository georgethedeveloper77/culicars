// ============================================================
// CuliCars — Section Builder: PHOTOS (LOCKED)
// Photos grouped by date from contributions, scrapers, auctions
// ============================================================

import prisma from '../../lib/prisma';
import type { PhotosSectionData, PhotoGroup } from '../../types/report.types';

export async function buildPhotosSection(vin: string): Promise<{
  data: PhotosSectionData;
  recordCount: number;
  dataStatus: 'found' | 'not_found' | 'not_checked';
}> {
  // Photos come from contributions (evidence_urls) and events with photo metadata
  const [contributions, photoEvents] = await Promise.all([
    prisma.contribution.findMany({
      where: {
        vin,
        status: 'approved',
        type: 'PHOTO_EVIDENCE',
      },
      select: {
        evidenceUrls: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    }),

    // Events that may have photos in metadata (listings, auctions)
    prisma.vehicleEvent.findMany({
      where: {
        vin,
        eventType: { in: ['LISTED_FOR_SALE', 'AUCTIONED', 'CONTRIBUTION_ADDED'] },
      },
      select: {
        eventDate: true,
        source: true,
        metadata: true,
      },
      orderBy: { eventDate: 'desc' },
    }),
  ]);

  // Collect all photos with dates
  const allPhotos: Array<{ date: string; url: string; source: string }> = [];

  // From contributions
  for (const contrib of contributions) {
    const urls = contrib.evidenceUrls as string[] | null;
    if (urls) {
      const dateKey = contrib.createdAt
        ? contrib.createdAt.toISOString().substring(0, 7) // YYYY-MM
        : 'unknown';
      for (const url of urls) {
        allPhotos.push({ date: dateKey, url, source: 'contribution' });
      }
    }
  }

  // From events
  for (const event of photoEvents) {
    const meta = event.metadata as Record<string, unknown> | null;
    const photoUrls = (meta?.photoUrls as string[] | undefined)
    ?? (meta?.photos as string[] | undefined);
    if (Array.isArray(photoUrls)) {
      const dateKey = event.eventDate.toISOString().substring(0, 7);
      for (const url of photoUrls) {
        allPhotos.push({
          date: dateKey,
          url,
          source: event.source ?? 'unknown',
        });
      }
    }
  }

  // Group by date (YYYY-MM)
  const groupMap = new Map<string, PhotoGroup>();
  for (const photo of allPhotos) {
    const existing = groupMap.get(photo.date);
    if (existing) {
      existing.count++;
      existing.photos.push({
        url: photo.url,
        source: photo.source,
      });
    } else {
      groupMap.set(photo.date, {
        date: photo.date,
        count: 1,
        photos: [{ url: photo.url, source: photo.source }],
      });
    }
  }

  // Sort groups by date descending
  const groups = Array.from(groupMap.values()).sort(
    (a, b) => b.date.localeCompare(a.date)
  );

  return {
    data: {
      groups,
      totalPhotos: allPhotos.length,
    },
    recordCount: allPhotos.length,
    dataStatus: allPhotos.length > 0 ? 'found' : 'not_found',
  };
}
