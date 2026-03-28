// apps/api/src/tests/ntsaCorParser.test.ts

import { describe, it, expect } from 'vitest';
import { ntsaCorParser } from '../services/ntsaCorParser';

const FULL_COR_TEXT = `
REPUBLIC OF KENYA
NATIONAL TRANSPORT AND SAFETY AUTHORITY
CERTIFICATE OF REGISTRATION

Registration Number: KCB 123A
Chassis No: JTMHE3FJ90K012345
Engine No: 2GD4567890
Make: TOYOTA
Model: HILUX
Year of Manufacture: 2019
Colour: WHITE
Body Type: PICKUP
Fuel Type: DIESEL
Date of First Registration: 15/03/2019
Expiry Date: 14/03/2026
Tare Weight: 1820
Gross Vehicle Weight: 3100

Owner Details (DISCARDED BY SYSTEM)
Name: JOHN DOE
ID: 12345678
Address: 123 NAIROBI ROAD
`;

const MINIMAL_COR_TEXT = `
Registration Number: KDB 456B
JTFDE3FJ90K099999
Engine: 1TR5678901
TOYOTA
LAND CRUISER
2015
`;

const POOR_COR_TEXT = `
Some random text that doesn't match COR format.
Nothing useful here.
`;

describe('ntsaCorParser', () => {
  describe('parse() — full COR', () => {
    it('extracts plate correctly', () => {
      const { fields } = ntsaCorParser.parse(FULL_COR_TEXT);
      expect(fields.plate).toBe('KCB123A');
    });

    it('extracts VIN from chassis field', () => {
      const { fields } = ntsaCorParser.parse(FULL_COR_TEXT);
      expect(fields.vin).toBe('JTMHE3FJ90K012345');
    });

    it('extracts engine number', () => {
      const { fields } = ntsaCorParser.parse(FULL_COR_TEXT);
      expect(fields.engineNumber).toBe('2GD4567890');
    });

    it('extracts make and model', () => {
      const { fields } = ntsaCorParser.parse(FULL_COR_TEXT);
      expect(fields.make).toBe('TOYOTA');
      expect(fields.model).toMatch(/HILUX/i);
    });

    it('extracts year of manufacture', () => {
      const { fields } = ntsaCorParser.parse(FULL_COR_TEXT);
      expect(fields.year).toBe(2019);
    });

    it('extracts colour', () => {
      const { fields } = ntsaCorParser.parse(FULL_COR_TEXT);
      expect(fields.colour).toMatch(/WHITE/i);
    });

    it('extracts fuel type', () => {
      const { fields } = ntsaCorParser.parse(FULL_COR_TEXT);
      expect(fields.fuelType).toMatch(/DIESEL/i);
    });

    it('parses registration date to ISO format', () => {
      const { fields } = ntsaCorParser.parse(FULL_COR_TEXT);
      expect(fields.registrationDate).toBe('2019-03-15');
    });

    it('parses expiry date to ISO format', () => {
      const { fields } = ntsaCorParser.parse(FULL_COR_TEXT);
      expect(fields.expiryDate).toBe('2026-03-14');
    });

    it('extracts tare weight as number', () => {
      const { fields } = ntsaCorParser.parse(FULL_COR_TEXT);
      expect(fields.tare).toBe(1820);
    });

    it('extracts gross weight as number', () => {
      const { fields } = ntsaCorParser.parse(FULL_COR_TEXT);
      expect(fields.grossWeight).toBe(3100);
    });

    it('returns high confidence for full COR', () => {
      const { confidence } = ntsaCorParser.parse(FULL_COR_TEXT);
      expect(confidence).toBeGreaterThanOrEqual(0.8);
    });

    it('does NOT include owner PII fields', () => {
      const { fields } = ntsaCorParser.parse(FULL_COR_TEXT);
      expect((fields as any).ownerName).toBeUndefined();
      expect((fields as any).ownerAddress).toBeUndefined();
      expect((fields as any).ownerId).toBeUndefined();
    });
  });

  describe('parse() — minimal COR', () => {
    it('still extracts plate from sparse text', () => {
      const { fields } = ntsaCorParser.parse(MINIMAL_COR_TEXT);
      expect(fields.plate).toBe('KDB456B');
    });

    it('still extracts VIN when not preceded by chassis label', () => {
      const { fields } = ntsaCorParser.parse(MINIMAL_COR_TEXT);
      expect(fields.vin).toBe('JTFDE3FJ90K099999');
    });

    it('returns success=true even with partial data', () => {
      const result = ntsaCorParser.parse(MINIMAL_COR_TEXT);
      expect(result.success).toBe(true);
    });

    it('reports warnings for missing fields', () => {
      const { warnings } = ntsaCorParser.parse(MINIMAL_COR_TEXT);
      expect(warnings.length).toBeGreaterThan(0);
    });
  });

  describe('parse() — poor/empty COR', () => {
    it('returns success=false for gibberish text', () => {
      const result = ntsaCorParser.parse(POOR_COR_TEXT);
      expect(result.success).toBe(false);
    });

    it('returns empty fields for gibberish text', () => {
      const { fields } = ntsaCorParser.parse(POOR_COR_TEXT);
      expect(fields.vin).toBeUndefined();
      expect(fields.plate).toBeUndefined();
    });

    it('returns confidence=0 for gibberish', () => {
      const { confidence } = ntsaCorParser.parse(POOR_COR_TEXT);
      expect(confidence).toBe(0);
    });

    it('handles empty string without throwing', () => {
      expect(() => ntsaCorParser.parse('')).not.toThrow();
    });
  });

  describe('date parsing edge cases', () => {
    it('handles DD-MM-YYYY format', () => {
      const text = `Date of First Registration: 01-06-2020\nExpiry Date: 31-05-2026\n${FULL_COR_TEXT}`;
      const { fields } = ntsaCorParser.parse(text);
      expect(fields.registrationDate).toBe('2020-06-01');
    });

    it('pads single-digit day and month', () => {
      const text = `Date of First Registration: 5/3/2021\n${FULL_COR_TEXT}`;
      const { fields } = ntsaCorParser.parse(text);
      expect(fields.registrationDate).toBe('2021-03-05');
    });
  });

  describe('plate extraction edge cases', () => {
    it('normalises plate spacing (KCB 123A → KCB123A)', () => {
      const { fields } = ntsaCorParser.parse(FULL_COR_TEXT);
      expect(fields.plate).not.toContain(' ');
    });

    it('picks most frequent plate when multiple candidates', () => {
      const text = `
        Registration Number: KCA 001A
        Vehicle: KCA 001A
        Plate: KXZ 999Z
      `;
      const { fields } = ntsaCorParser.parse(text);
      expect(fields.plate).toBe('KCA001A');
    });
  });
});
