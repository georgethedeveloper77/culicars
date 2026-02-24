export function normalizeVin(vin: string): string {
  return vin.trim().toUpperCase();
}

export function normalizePlate(plate: string): string {
  return plate.trim().toUpperCase().replace(/\s+/g, "");
}