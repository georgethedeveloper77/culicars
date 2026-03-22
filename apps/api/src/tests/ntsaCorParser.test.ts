// ============================================================
// CuliCars — Thread 4: NTSA COR Parser Tests
// ============================================================

import { describe, it, expect } from 'vitest';
import { parseCorText } from '../services/ntsaCorParser';

// Simulated OCR text from a typical NTSA COR PDF
const SAMPLE_COR_TEXT = `
REPUBLIC OF KENYA
NATIONAL TRANSPORT AND SAFETY AUTHORITY
CERTIFICATE OF REGISTRATION

Registration Number: KCA 123A
Chassis Number: JTDBR32E540012345
Make: TOYOTA
Model: FIELDER
Body Type: STATION WAGON
Colour: SILVER
Year of Manufacture: 2014
Engine Capacity: 1500 CC
Fuel Type: PETROL
Date of Registration: 15/03/2015
Inspection Status: PASSED
Date of Inspection: 10/01/2024
Caveat: NO CAVEAT
Logbook Number: LBK-2015-034567
Number of Transfers: 2
Last Transfer Date: 22/06/2022

Owner Name: JOHN KAMAU MWANGI
ID Number: 12345678
Address: P.O. Box 12345, Nairobi
Phone: 0712345678
`;

describe('ntsaCorParser', () => {
  describe('parseCorText', () => {
    it('extracts plate and normalizes it', () => {
      const result = parseCorText(SAMPLE_COR_TEXT);
      expect(result.plate).toBe('KCA123A');
      expect(result.plateDisplay).toBe('KCA 123A');
    });

    it('extracts VIN/chassis', () => {
      const result = parseCorText(SAMPLE_COR_TEXT);
      expect(result.vin).toBe('JTDBR32E540012345');
    });

    it('extracts make and model', () => {
      const result = parseCorText(SAMPLE_COR_TEXT);
      expect(result.make).toBe('TOYOTA');
      expect(result.model).toBe('FIELDER');
    });

    it('extracts body type and color', () => {
      const result = parseCorText(SAMPLE_COR_TEXT);
      expect(result.bodyType).toBe('STATION WAGON');
      expect(result.color).toBe('SILVER');
    });

    it('extracts year of manufacture', () => {
      const result = parseCorText(SAMPLE_COR_TEXT);
      expect(result.yearOfManufacture).toBe(2014);
    });

    it('extracts engine capacity as number', () => {
      const result = parseCorText(SAMPLE_COR_TEXT);
      expect(result.engineCapacity).toBe(1500);
    });

    it('extracts fuel type', () => {
      const result = parseCorText(SAMPLE_COR_TEXT);
      expect(result.fuelType).toBe('PETROL');
    });

    it('parses registration date (DD/MM/YYYY Kenya format)', () => {
      const result = parseCorText(SAMPLE_COR_TEXT);
      expect(result.registrationDate).toBeInstanceOf(Date);
      expect(result.registrationDate!.getFullYear()).toBe(2015);
      expect(result.registrationDate!.getMonth()).toBe(2); // March = 2
    });

    it('normalizes inspection status', () => {
      const result = parseCorText(SAMPLE_COR_TEXT);
      expect(result.inspectionStatus).toBe('passed');
    });

    it('parses inspection date', () => {
      const result = parseCorText(SAMPLE_COR_TEXT);
      expect(result.inspectionDate).toBeInstanceOf(Date);
      expect(result.inspectionDate!.getFullYear()).toBe(2024);
    });

    it('normalizes caveat status to clear', () => {
      const result = parseCorText(SAMPLE_COR_TEXT);
      expect(result.caveatStatus).toBe('clear');
    });

    it('extracts logbook number', () => {
      const result = parseCorText(SAMPLE_COR_TEXT);
      expect(result.logbookNumber).toBe('LBK-2015-034567');
    });

    it('extracts transfer count', () => {
      const result = parseCorText(SAMPLE_COR_TEXT);
      expect(result.numberOfTransfers).toBe(2);
    });

    it('parses last transfer date', () => {
      const result = parseCorText(SAMPLE_COR_TEXT);
      expect(result.lastTransferDate).toBeInstanceOf(Date);
      expect(result.lastTransferDate!.getFullYear()).toBe(2022);
    });

    it('DOES NOT include owner name in result', () => {
      const result = parseCorText(SAMPLE_COR_TEXT);
      const resultStr = JSON.stringify(result);
      expect(resultStr).not.toContain('JOHN');
      expect(resultStr).not.toContain('KAMAU');
      expect(resultStr).not.toContain('MWANGI');
    });

    it('DOES NOT include owner ID in result', () => {
      const result = parseCorText(SAMPLE_COR_TEXT);
      const resultStr = JSON.stringify(result);
      expect(resultStr).not.toContain('12345678');
    });

    it('DOES NOT include owner address in result', () => {
      const result = parseCorText(SAMPLE_COR_TEXT);
      const resultStr = JSON.stringify(result);
      expect(resultStr).not.toContain('P.O. Box');
    });
  });

  describe('edge cases', () => {
    it('handles caveat present', () => {
      const text = SAMPLE_COR_TEXT.replace('NO CAVEAT', 'CAVEAT REGISTERED');
      const result = parseCorText(text);
      expect(result.caveatStatus).toBe('caveat');
    });

    it('handles failed inspection', () => {
      const text = SAMPLE_COR_TEXT.replace(
        'Inspection Status: PASSED',
        'Inspection Status: FAILED'
      );
      const result = parseCorText(text);
      expect(result.inspectionStatus).toBe('failed');
    });

    it('handles expired inspection', () => {
      const text = SAMPLE_COR_TEXT.replace(
        'Inspection Status: PASSED',
        'Inspection Status: EXPIRED'
      );
      const result = parseCorText(text);
      expect(result.inspectionStatus).toBe('expired');
    });

    it('handles missing optional fields gracefully', () => {
      const minimalText = `
Registration Number: KCA 456B
Chassis Number: JTDBR32E550023456
Make: TOYOTA
Model: FIELDER
      `;
      const result = parseCorText(minimalText);
      expect(result.plate).toBe('KCA456B');
      expect(result.vin).toBe('JTDBR32E550023456');
      expect(result.yearOfManufacture).toBeNull();
      expect(result.inspectionStatus).toBe('unknown');
      expect(result.caveatStatus).toBe('unknown');
    });
  });
});
