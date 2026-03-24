"use strict";
// ============================================================
// CuliCars — Thread 4: NTSA COR Parser Tests
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const ntsaCorParser_1 = require("../services/ntsaCorParser");
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
(0, vitest_1.describe)('ntsaCorParser', () => {
    (0, vitest_1.describe)('parseCorText', () => {
        (0, vitest_1.it)('extracts plate and normalizes it', () => {
            const result = (0, ntsaCorParser_1.parseCorText)(SAMPLE_COR_TEXT);
            (0, vitest_1.expect)(result.plate).toBe('KCA123A');
            (0, vitest_1.expect)(result.plateDisplay).toBe('KCA 123A');
        });
        (0, vitest_1.it)('extracts VIN/chassis', () => {
            const result = (0, ntsaCorParser_1.parseCorText)(SAMPLE_COR_TEXT);
            (0, vitest_1.expect)(result.vin).toBe('JTDBR32E540012345');
        });
        (0, vitest_1.it)('extracts make and model', () => {
            const result = (0, ntsaCorParser_1.parseCorText)(SAMPLE_COR_TEXT);
            (0, vitest_1.expect)(result.make).toBe('TOYOTA');
            (0, vitest_1.expect)(result.model).toBe('FIELDER');
        });
        (0, vitest_1.it)('extracts body type and color', () => {
            const result = (0, ntsaCorParser_1.parseCorText)(SAMPLE_COR_TEXT);
            (0, vitest_1.expect)(result.bodyType).toBe('STATION WAGON');
            (0, vitest_1.expect)(result.color).toBe('SILVER');
        });
        (0, vitest_1.it)('extracts year of manufacture', () => {
            const result = (0, ntsaCorParser_1.parseCorText)(SAMPLE_COR_TEXT);
            (0, vitest_1.expect)(result.yearOfManufacture).toBe(2014);
        });
        (0, vitest_1.it)('extracts engine capacity as number', () => {
            const result = (0, ntsaCorParser_1.parseCorText)(SAMPLE_COR_TEXT);
            (0, vitest_1.expect)(result.engineCapacity).toBe(1500);
        });
        (0, vitest_1.it)('extracts fuel type', () => {
            const result = (0, ntsaCorParser_1.parseCorText)(SAMPLE_COR_TEXT);
            (0, vitest_1.expect)(result.fuelType).toBe('PETROL');
        });
        (0, vitest_1.it)('parses registration date (DD/MM/YYYY Kenya format)', () => {
            const result = (0, ntsaCorParser_1.parseCorText)(SAMPLE_COR_TEXT);
            (0, vitest_1.expect)(result.registrationDate).toBeInstanceOf(Date);
            (0, vitest_1.expect)(result.registrationDate.getFullYear()).toBe(2015);
            (0, vitest_1.expect)(result.registrationDate.getMonth()).toBe(2); // March = 2
        });
        (0, vitest_1.it)('normalizes inspection status', () => {
            const result = (0, ntsaCorParser_1.parseCorText)(SAMPLE_COR_TEXT);
            (0, vitest_1.expect)(result.inspectionStatus).toBe('passed');
        });
        (0, vitest_1.it)('parses inspection date', () => {
            const result = (0, ntsaCorParser_1.parseCorText)(SAMPLE_COR_TEXT);
            (0, vitest_1.expect)(result.inspectionDate).toBeInstanceOf(Date);
            (0, vitest_1.expect)(result.inspectionDate.getFullYear()).toBe(2024);
        });
        (0, vitest_1.it)('normalizes caveat status to clear', () => {
            const result = (0, ntsaCorParser_1.parseCorText)(SAMPLE_COR_TEXT);
            (0, vitest_1.expect)(result.caveatStatus).toBe('clear');
        });
        (0, vitest_1.it)('extracts logbook number', () => {
            const result = (0, ntsaCorParser_1.parseCorText)(SAMPLE_COR_TEXT);
            (0, vitest_1.expect)(result.logbookNumber).toBe('LBK-2015-034567');
        });
        (0, vitest_1.it)('extracts transfer count', () => {
            const result = (0, ntsaCorParser_1.parseCorText)(SAMPLE_COR_TEXT);
            (0, vitest_1.expect)(result.numberOfTransfers).toBe(2);
        });
        (0, vitest_1.it)('parses last transfer date', () => {
            const result = (0, ntsaCorParser_1.parseCorText)(SAMPLE_COR_TEXT);
            (0, vitest_1.expect)(result.lastTransferDate).toBeInstanceOf(Date);
            (0, vitest_1.expect)(result.lastTransferDate.getFullYear()).toBe(2022);
        });
        (0, vitest_1.it)('DOES NOT include owner name in result', () => {
            const result = (0, ntsaCorParser_1.parseCorText)(SAMPLE_COR_TEXT);
            const resultStr = JSON.stringify(result);
            (0, vitest_1.expect)(resultStr).not.toContain('JOHN');
            (0, vitest_1.expect)(resultStr).not.toContain('KAMAU');
            (0, vitest_1.expect)(resultStr).not.toContain('MWANGI');
        });
        (0, vitest_1.it)('DOES NOT include owner ID in result', () => {
            const result = (0, ntsaCorParser_1.parseCorText)(SAMPLE_COR_TEXT);
            const resultStr = JSON.stringify(result);
            (0, vitest_1.expect)(resultStr).not.toContain('12345678');
        });
        (0, vitest_1.it)('DOES NOT include owner address in result', () => {
            const result = (0, ntsaCorParser_1.parseCorText)(SAMPLE_COR_TEXT);
            const resultStr = JSON.stringify(result);
            (0, vitest_1.expect)(resultStr).not.toContain('P.O. Box');
        });
    });
    (0, vitest_1.describe)('edge cases', () => {
        (0, vitest_1.it)('handles caveat present', () => {
            const text = SAMPLE_COR_TEXT.replace('NO CAVEAT', 'CAVEAT REGISTERED');
            const result = (0, ntsaCorParser_1.parseCorText)(text);
            (0, vitest_1.expect)(result.caveatStatus).toBe('caveat');
        });
        (0, vitest_1.it)('handles failed inspection', () => {
            const text = SAMPLE_COR_TEXT.replace('Inspection Status: PASSED', 'Inspection Status: FAILED');
            const result = (0, ntsaCorParser_1.parseCorText)(text);
            (0, vitest_1.expect)(result.inspectionStatus).toBe('failed');
        });
        (0, vitest_1.it)('handles expired inspection', () => {
            const text = SAMPLE_COR_TEXT.replace('Inspection Status: PASSED', 'Inspection Status: EXPIRED');
            const result = (0, ntsaCorParser_1.parseCorText)(text);
            (0, vitest_1.expect)(result.inspectionStatus).toBe('expired');
        });
        (0, vitest_1.it)('handles missing optional fields gracefully', () => {
            const minimalText = `
Registration Number: KCA 456B
Chassis Number: JTDBR32E550023456
Make: TOYOTA
Model: FIELDER
      `;
            const result = (0, ntsaCorParser_1.parseCorText)(minimalText);
            (0, vitest_1.expect)(result.plate).toBe('KCA456B');
            (0, vitest_1.expect)(result.vin).toBe('JTDBR32E550023456');
            (0, vitest_1.expect)(result.yearOfManufacture).toBeNull();
            (0, vitest_1.expect)(result.inspectionStatus).toBe('unknown');
            (0, vitest_1.expect)(result.caveatStatus).toBe('unknown');
        });
    });
});
