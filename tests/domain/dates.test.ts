import { describe, it, expect } from 'vitest';
import { generateDateRange } from '@/core/domain/dates';

describe('Civil Dates Domain Logic', () => {
  it('generates an array of civil dates between start and end date inclusive', () => {
    const dates = generateDateRange('2026-11-15', '2026-11-18');
    expect(dates).toEqual([
      '2026-11-15',
      '2026-11-16',
      '2026-11-17',
      '2026-11-18',
    ]);
  });

  it('handles single day trip', () => {
    const dates = generateDateRange('2026-12-01', '2026-12-01');
    expect(dates).toEqual(['2026-12-01']);
  });

  it('handles month and year rollover without timezone distortion', () => {
    const dates = generateDateRange('2026-12-30', '2027-01-02');
    expect(dates).toEqual([
      '2026-12-30',
      '2026-12-31',
      '2027-01-01',
      '2027-01-02',
    ]);
  });
});
