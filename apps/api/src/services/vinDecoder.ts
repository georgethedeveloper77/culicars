// apps/api/src/services/vinDecoder.ts
import { validateVin, decodeVin, type VinDecode } from '@culicars/utils';

export interface VinDecodeResult {
  valid: boolean;
  vin: string;
  errors: string[];
  decode: VinDecode | null;
}

export function validateAndDecode(input: string): VinDecodeResult {
  const validation = validateVin(input);

  if (!validation.valid) {
    return { valid: false, vin: validation.vin, errors: validation.errors, decode: null };
  }

  const decode = decodeVin(validation.vin);
  return { valid: true, vin: validation.vin, errors: [], decode };
}

export { validateVin, isValidVin, decodeVin } from '@culicars/utils';
