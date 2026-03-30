// apps/api/src/services/__tests__/userVehiclesService.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock prisma before importing service
vi.mock('../../lib/prisma', () => ({
  prisma: {
    user_vehicles: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    profile: {
      upsert: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

// Mock normalizePlate
vi.mock('@culicars/utils', () => ({
  normalizePlate: vi.fn((p: string) => ({ normalized: p.toUpperCase().replace(/\s/g, '') })),
}));

import { prisma } from '../../lib/prisma';
import {
  getUserVehicles,
  addUserVehicle,
  removeUserVehicle,
  updatePreferredLocation,
  getPreferredLocation,
} from '../userVehiclesService';

const db = prisma as any;

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getUserVehicles', () => {
  it('returns vehicles for the user', async () => {
    const mockList = [{ id: '1', plate: 'KDA123A', user_id: 'u1' }];
    db.user_vehicles.findMany.mockResolvedValue(mockList);

    const result = await getUserVehicles('u1');
    expect(result).toEqual(mockList);
    expect(db.user_vehicles.findMany).toHaveBeenCalledWith({
      where: { user_id: 'u1' },
      orderBy: { created_at: 'desc' },
    });
  });
});

describe('addUserVehicle', () => {
  it('creates a vehicle when no duplicate exists', async () => {
    db.user_vehicles.findFirst.mockResolvedValue(null);
    db.user_vehicles.create.mockResolvedValue({ id: '2', plate: 'KDA123A' });

    const result = await addUserVehicle('u1', {
      plate: 'KDA 123A',
      relationshipType: 'owner',
    });

    expect(db.user_vehicles.create).toHaveBeenCalled();
    expect(result).toMatchObject({ plate: 'KDA123A' });
  });

  it('throws when no plate or VIN provided', async () => {
    await expect(
      addUserVehicle('u1', { relationshipType: 'owner' }),
    ).rejects.toThrow('At least one of plate or VIN is required');
  });

  it('throws when vehicle already exists for user', async () => {
    db.user_vehicles.findFirst.mockResolvedValue({ id: 'existing' });
    await expect(
      addUserVehicle('u1', { plate: 'KDA123A', relationshipType: 'owner' }),
    ).rejects.toThrow('This vehicle is already in your list');
  });
});

describe('removeUserVehicle', () => {
  it('deletes an owned vehicle', async () => {
    db.user_vehicles.findFirst.mockResolvedValue({ id: 'v1' });
    db.user_vehicles.delete.mockResolvedValue({});

    const result = await removeUserVehicle('u1', 'v1');
    expect(result).toEqual({ success: true });
    expect(db.user_vehicles.delete).toHaveBeenCalledWith({ where: { id: 'v1' } });
  });

  it('throws when vehicle not found', async () => {
    db.user_vehicles.findFirst.mockResolvedValue(null);
    await expect(removeUserVehicle('u1', 'v999')).rejects.toThrow('Vehicle not found');
  });
});

describe('updatePreferredLocation', () => {
  it('upserts the profile with coordinates', async () => {
    db.profile.upsert.mockResolvedValue({ user_id: 'u1', preferred_lat: -1.3, preferred_lng: 36.8 });

    const result = await updatePreferredLocation('u1', { lat: -1.3, lng: 36.8, locationName: 'Nairobi' });
    expect(db.profile.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { user_id: 'u1' },
        update: expect.objectContaining({ preferred_lat: -1.3 }),
      }),
    );
    expect(result).toMatchObject({ preferred_lat: -1.3 });
  });
});

describe('getPreferredLocation', () => {
  it('returns null when no profile exists', async () => {
    db.profile.findUnique.mockResolvedValue(null);
    const result = await getPreferredLocation('u1');
    expect(result).toBeNull();
  });

  it('returns location data when profile exists', async () => {
    db.profile.findUnique.mockResolvedValue({
      preferred_lat: -1.3,
      preferred_lng: 36.8,
      preferred_location_name: 'Nairobi',
    });
    const result = await getPreferredLocation('u1');
    expect(result).toMatchObject({ preferred_lat: -1.3 });
  });
});
