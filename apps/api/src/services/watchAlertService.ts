// apps/api/src/services/watchAlertService.ts
import { prisma } from '../lib/prisma';
import { normalizePlate } from '@culicars/utils';
import { AppError } from '../lib/errors';

export type AlertType =
  | 'stolen_vehicle'
  | 'recovered_vehicle'
  | 'damage'
  | 'vandalism'
  | 'parts_theft'
  | 'suspicious_activity'
  | 'hijack';

export type AlertStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'disputed'
  | 'needs_more_info'
  | 'archived';

export type AlertCategory = 'vehicle' | 'area';

export interface SubmitAlertInput {
  plate?: string;
  vin?: string;
  type: AlertType;
  lat?: number;
  lng?: number;
  locationName?: string;
  description: string;
  evidenceUrls?: string[];
  submittedBy: string;
}

export interface ModerateAlertInput {
  alertId: string;
  status: AlertStatus;
  moderatedBy: string;
  moderationNote?: string;
}

export interface ListAlertsOptions {
  status?: AlertStatus;
  type?: AlertType;
  plate?: string;
  vin?: string;
  page?: number;
  limit?: number;
}

const VEHICLE_ALERT_TYPES: AlertType[] = [
  'stolen_vehicle',
  'recovered_vehicle',
  'damage',
];

const AREA_ALERT_TYPES: AlertType[] = [
  'vandalism',
  'parts_theft',
  'suspicious_activity',
  'hijack',
];

function alertCategory(type: AlertType): AlertCategory {
  return VEHICLE_ALERT_TYPES.includes(type) ? 'vehicle' : 'area';
}

export const watchAlertService = {
  async submit(input: SubmitAlertInput) {
    const category = alertCategory(input.type);

    // Vehicle alerts require plate or VIN
    if (category === 'vehicle' && !input.plate && !input.vin) {
      throw new AppError('Vehicle alerts require a plate or VIN', 400);
    }

    // Area alerts require a location
    if (category === 'area' && input.lat == null && !input.locationName) {
      throw new AppError('Area alerts require a location', 400);
    }

    const normalizedPlate = input.plate
      ? normalizePlate(input.plate)?.normalized ?? input.plate.toUpperCase().replace(/\s/g, '')
      : undefined;

    const alert = await (prisma as any).watch_alerts.create({
      data: {
        plate: normalizedPlate ?? null,
        vin: input.vin?.toUpperCase() ?? null,
        type: input.type,
        lat: input.lat ?? null,
        lng: input.lng ?? null,
        location_name: input.locationName ?? null,
        description: input.description,
        status: 'pending',
        submitted_by: input.submittedBy,
        evidence_urls: input.evidenceUrls ?? [],
      },
    });

    return alert;
  },

  async moderate(input: ModerateAlertInput) {
    const alert = await (prisma as any).watch_alerts.findUnique({
      where: { id: input.alertId },
    });

    if (!alert) throw new AppError('Alert not found', 404);

    // All records immutable — only status transitions, no deletion
    const updated = await (prisma as any).watch_alerts.update({
      where: { id: input.alertId },
      data: {
        status: input.status,
        moderated_by: input.moderatedBy,
        moderation_note: input.moderationNote ?? null,
        moderated_at: new Date(),
      },
    });

    return updated;
  },

  async listPublic(options: ListAlertsOptions = {}) {
    const { type, page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { status: 'approved' };
    if (type) where.type = type;

    const [alerts, total] = await Promise.all([
      (prisma as any).watch_alerts.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          plate: true,
          type: true,
          lat: true,
          lng: true,
          location_name: true,
          description: true,
          created_at: true,
          evidence_urls: true,
          // Never expose vin, submitted_by, moderation details in public feed
        },
      }),
      (prisma as any).watch_alerts.count({ where }),
    ]);

    return { alerts, total, page, limit, pages: Math.ceil(total / limit) };
  },

  async listForAdmin(options: ListAlertsOptions = {}) {
    const { status, type, plate, vin, page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (type) where.type = type;
    if (plate) where.plate = { contains: plate.toUpperCase() };
    if (vin) where.vin = { contains: vin.toUpperCase() };

    const [alerts, total] = await Promise.all([
      (prisma as any).watch_alerts.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      (prisma as any).watch_alerts.count({ where }),
    ]);

    return { alerts, total, page, limit, pages: Math.ceil(total / limit) };
  },

  async getById(id: string) {
    const alert = await (prisma as any).watch_alerts.findUnique({
      where: { id },
    });
    if (!alert) throw new AppError('Alert not found', 404);
    return alert;
  },

  async getByPlate(plate: string) {
    const normalized = normalizePlate(plate)?.normalized ?? plate.toUpperCase().replace(/\s/g, '');
    return (prisma as any).watch_alerts.findMany({
      where: { plate: normalized, status: 'approved' },
      orderBy: { created_at: 'desc' },
      take: 10,
    });
  },

  async pendingCount() {
    return (prisma as any).watch_alerts.count({ where: { status: 'pending' } });
  },
};
