"use strict";
// packages/utils/vinValidator.ts
// ISO 3779 VIN validator with check digit + WMI decode
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateVin = validateVin;
exports.isValidVin = isValidVin;
exports.decodeVin = decodeVin;
const VIN_REGEX = /^[A-HJ-NPR-Z0-9]{17}$/;
const TRANSLITERATE = {
    A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8,
    J: 1, K: 2, L: 3, M: 4, N: 5, P: 7, R: 9,
    S: 2, T: 3, U: 4, V: 5, W: 6, X: 7, Y: 8, Z: 9,
};
const WEIGHTS = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];
function charValue(ch) {
    if (/\d/.test(ch))
        return parseInt(ch, 10);
    return TRANSLITERATE[ch] ?? 0;
}
function calculateCheckDigit(vin) {
    let sum = 0;
    for (let i = 0; i < 17; i++) {
        sum += charValue(vin[i]) * WEIGHTS[i];
    }
    const remainder = sum % 11;
    return remainder === 10 ? 'X' : remainder.toString();
}
function validateVin(input) {
    const cleaned = input.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    const errors = [];
    if (cleaned.length !== 17) {
        errors.push(`VIN must be exactly 17 characters (got ${cleaned.length})`);
    }
    if (cleaned.length === 17 && !VIN_REGEX.test(cleaned)) {
        errors.push('VIN contains invalid characters (I, O, Q not allowed)');
    }
    if (errors.length > 0)
        return { valid: false, vin: cleaned, errors };
    const wmi = cleaned.substring(0, 3);
    const vds = cleaned.substring(3, 9);
    const vis = cleaned.substring(9, 17);
    const checkDigitValid = calculateCheckDigit(cleaned) === cleaned[8];
    return { valid: true, vin: cleaned, errors: [], wmi, vds, vis, checkDigitValid };
}
function isValidVin(input) {
    return validateVin(input).valid;
}
// WMI database — Kenya-common manufacturers
const WMI_DATABASE = {
    JTD: { make: 'Toyota', country: 'JP' },
    JTE: { make: 'Toyota', country: 'JP' },
    JTF: { make: 'Toyota', country: 'JP' },
    JTH: { make: 'Lexus', country: 'JP' },
    JN1: { make: 'Nissan', country: 'JP' },
    JN3: { make: 'Nissan', country: 'JP' },
    JF1: { make: 'Subaru', country: 'JP' },
    JF2: { make: 'Subaru', country: 'JP' },
    JHM: { make: 'Honda', country: 'JP' },
    JHL: { make: 'Honda', country: 'JP' },
    JMZ: { make: 'Mazda', country: 'JP' },
    JM1: { make: 'Mazda', country: 'JP' },
    JDA: { make: 'Daihatsu', country: 'JP' },
    JS1: { make: 'Suzuki', country: 'JP' },
    JS3: { make: 'Suzuki', country: 'JP' },
    JA3: { make: 'Mitsubishi', country: 'JP' },
    JA4: { make: 'Mitsubishi', country: 'JP' },
    JMB: { make: 'Mitsubishi', country: 'JP' },
    SAL: { make: 'Land Rover', country: 'GB' },
    SAJ: { make: 'Jaguar', country: 'GB' },
    WBA: { make: 'BMW', country: 'DE' },
    WBS: { make: 'BMW M', country: 'DE' },
    WDB: { make: 'Mercedes-Benz', country: 'DE' },
    WDD: { make: 'Mercedes-Benz', country: 'DE' },
    WAU: { make: 'Audi', country: 'DE' },
    WVW: { make: 'Volkswagen', country: 'DE' },
    KMH: { make: 'Hyundai', country: 'KR' },
    KNA: { make: 'Kia', country: 'KR' },
    MA1: { make: 'Mahindra', country: 'IN' },
    MAT: { make: 'Tata', country: 'IN' },
    AHT: { make: 'Toyota SA', country: 'ZA' },
};
const YEAR_CODES = {
    A: 2010, B: 2011, C: 2012, D: 2013, E: 2014, F: 2015,
    G: 2016, H: 2017, J: 2018, K: 2019, L: 2020, M: 2021,
    N: 2022, P: 2023, R: 2024, S: 2025, T: 2026, V: 2027,
    W: 2028, X: 2029, Y: 2030,
    '1': 2001, '2': 2002, '3': 2003, '4': 2004, '5': 2005,
    '6': 2006, '7': 2007, '8': 2008, '9': 2009,
};
function decodeVin(vin) {
    const validation = validateVin(vin);
    if (!validation.valid)
        return null;
    const cleaned = validation.vin;
    const wmi = cleaned.substring(0, 3);
    const vds = cleaned.substring(3, 9);
    const vis = cleaned.substring(9, 17);
    const manufacturer = WMI_DATABASE[wmi] ?? null;
    const yearChar = cleaned[9];
    const modelYear = YEAR_CODES[yearChar] ?? null;
    return {
        make: manufacturer?.make ?? null,
        country: manufacturer?.country ?? null,
        wmi, vds, vis,
        modelYear: modelYear ? modelYear.toString() : null,
        plantCode: cleaned[10],
        sequentialNumber: cleaned.substring(11),
    };
}
