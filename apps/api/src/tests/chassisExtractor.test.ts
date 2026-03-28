// apps/api/src/tests/chassisExtractor.test.ts

import { describe, it, expect } from 'vitest';
import { chassisExtractor } from '../services/chassisExtractor';

describe('chassisExtractor', () => {
  it('extracts chassis number from labelled line', () => {
    const text = 'Chassis No: JTMHE3FJ90K012345';
    expect(chassisExtractor.extract(text)).toBe('JTMHE3FJ90K012345');
  });

  it('extracts from "Frame No" label', () => {
    const text = 'Frame No: ABC1234567DEF5678';
    const result = chassisExtractor.extract(text);
    expect(result).toBeTruthy();
  });

  it('returns null when no chassis label present', () => {
    expect(chassisExtractor.extract('Hello world')).toBeNull();
  });

  it('handles chassis without colon separator', () => {
    const text = 'Chassis Number JTMHE3FJ90K012345\nOther info';
    expect(chassisExtractor.extract(text)).toBe('JTMHE3FJ90K012345');
  });

  it('extracts correct value when multiple lines present', () => {
    const text = `
Make: Toyota
Chassis No: JTMHE3FJ90K012345
Engine: 2GD4567890
    `;
    expect(chassisExtractor.extract(text)).toBe('JTMHE3FJ90K012345');
  });
});
