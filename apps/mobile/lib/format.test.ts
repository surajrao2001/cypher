import { clampQuantity, formatMinorUnits, spotsLeft } from '@/lib/format';

describe('spotsLeft', () => {
  it('returns remaining capacity', () => {
    expect(spotsLeft(180, 142)).toBe(38);
  });

  it('never goes below zero', () => {
    expect(spotsLeft(200, 200)).toBe(0);
    expect(spotsLeft(10, 12)).toBe(0);
  });
});

describe('clampQuantity', () => {
  it('clamps to the inclusive range', () => {
    expect(clampQuantity(0, 1, 8)).toBe(1);
    expect(clampQuantity(3, 1, 8)).toBe(3);
    expect(clampQuantity(12, 1, 8)).toBe(8);
  });
});

describe('formatMinorUnits', () => {
  it('formats INR from paise', () => {
    expect(formatMinorUnits(79900)).toContain('799');
  });
});
