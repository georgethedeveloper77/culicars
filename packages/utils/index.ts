// packages/utils/index.ts
export {
  normalizePlate,
  isValidKenyaPlate,
  detectInputType,
  type NormalizedPlate,
  type PlateFormat,
} from './plateNormalizer';

export {
  validateVin,
  isValidVin,
  decodeVin,
  type VinValidation,
  type VinDecode,
} from './vinValidator';
