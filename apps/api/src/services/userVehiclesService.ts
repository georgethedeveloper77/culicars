// apps/api/src/services/userVehiclesService.ts

import { prisma } from '../lib/prisma';
import { normalizePlate } from '@culicars/utils';

export type RelationshipType = 'owner' | 'driver' | 'tracker' | 'watchlist';

export interface AddVehicleInput {
  plate?: string;
  vin?: string;
  relationshipType: RelationshipType;
  nickname?: string;
  alertRadiusKm?: number;
}

export interface UpdatePreferredLocationInput {
  lat: number;
  lng: number;
  locationName?: string;
}

// ── helpers ──────────────────────────────────────────────────────────────────

function resolvePlate(raw?: string): string | undefined {
  if (!raw) return undefined;
  try {
    const result = normalizePlate(raw);
    return result?.normalized ?? raw.toUpperCase().replace(/\s+/g, '');
  } catch {
    return raw.toUpperCase().replace(/\s+/g, '');
  }
}

// ── service ──────────────────────────────────────────────────────────────────

export async function getUserVehicles(userId: string) {
  return (prisma as any).user_vehicles.findMany({
    where: { user_id: userId },
    orderBy: { created_at: 'desc' },
  });
}

export async function addUserVehicle(userId: string, input: AddVehicleInput) {
  const plate = resolvePlate(input.plate);
  const vin = input.vin?.toUpperCase().trim() || undefined;

  if (!plate && !vin) {
    throw new Error('At least one of plate or VIN is required');
  }

  // Prevent duplicates for the same user
  const existing = await (prisma as any).user_vehicles.findFirst({
    where: {
      user_id: userId,
      ...(plate ? { plate } : {}),
      ...(vin ? { vin } : {}),
    },
  });

  if (existing) {
    throw new Error('This vehicle is already in your list');
  }

  return (prisma as any).user_vehicles.create({
    data: {
      user_id: userId,
      plate: plate ?? null,
      vin: vin ?? null,
      relationship_type: input.relationshipType,
      nickname: input.nickname ?? null,
      alert_radius_km: input.alertRadiusKm ?? 10,
    },
  });
}

export async function updateUserVehicle(
  userId: string,
  vehicleId: string,
  patch: Partial<Pick<AddVehicleInput, 'nickname' | 'alertRadiusKm' | 'relationshipType'>>,
) {
  const record = await (prisma as any).user_vehicles.findFirst({
    where: { id: vehicleId, user_id: userId },
  });

  if (!record) throw new Error('Vehicle not found');

  return (prisma as any).user_vehicles.update({
    where: { id: vehicleId },
    data: {
      ...(patch.nickname !== undefined ? { nickname: patch.nickname } : {}),
      ...(patch.alertRadiusKm !== undefined ? { alert_radius_km: patch.alertRadiusKm } : {}),
      ...(patch.relationshipType !== undefined ? { relationship_type: patch.relationshipType } : {}),
      updated_at: new Date(),
    },
  });
}

export async function removeUserVehicle(userId: string, vehicleId: string) {
  const record = await (prisma as any).user_vehicles.findFirst({
    where: { id: vehicleId, user_id: userId },
  });

  if (!record) throw new Error('Vehicle not found');

  await (prisma as any).user_vehicles.delete({ where: { id: vehicleId } });
  return { success: true };
}

export async function updatePreferredLocation(
  userId: string,
  input: UpdatePreferredLocationInput,
) {
  return (prisma as any).profile.upsert({
    where: { userId },
    update: {
      preferred_lat: input.lat,
      preferred_lng: input.lng,
      preferred_location_name: input.locationName ?? null,
    },
    create: {
      userId,
      preferred_lat: input.lat,
      preferred_lng: input.lng,
      preferred_location_name: input.locationName ?? null,
    },
  });
}

export async function getPreferredLocation(userId: string) {
  const profile = await (prisma as any).profile.findUnique({
    where: { userId },
    select: {
      preferred_lat: true,
      preferred_lng: true,
      preferred_location_name: true,
    },
  });
  return profile ?? null;
}
