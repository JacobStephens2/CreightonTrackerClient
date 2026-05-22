import { describe, it, expect } from 'vitest';
import { buildObservationCode, isPeakTypeMucus } from '../creighton-codes';

describe('buildObservationCode', () => {
  it('returns dash for no observations', () => {
    expect(buildObservationCode()).toBe('—');
  });

  it('returns bleeding code alone', () => {
    expect(buildObservationCode('H')).toBe('H');
  });

  it('returns dry code', () => {
    expect(buildObservationCode(undefined, '0')).toBe('0');
  });

  it('combines mucus stretch and characteristics', () => {
    expect(buildObservationCode(undefined, '10', ['K', 'L'])).toBe('10KL');
  });

  it('includes frequency', () => {
    expect(buildObservationCode(undefined, '6', ['C'], 'x2')).toBe('6C x2');
  });

  it('includes bleeding and mucus', () => {
    expect(buildObservationCode('L', '4', ['K'])).toBe('L 4K');
  });

  it('includes brown marker', () => {
    expect(buildObservationCode(undefined, undefined, undefined, undefined, true)).toBe('B');
  });

  it('combines bleeding, brown, mucus, and frequency', () => {
    expect(buildObservationCode('VL', '2W', ['C'], 'x1', true)).toBe('VL B 2WC x1');
  });
});

describe('isPeakTypeMucus', () => {
  it('returns true for stretchy mucus (10)', () => {
    expect(isPeakTypeMucus('10')).toBe(true);
  });

  it('returns true for clear (K) characteristic', () => {
    expect(isPeakTypeMucus('4', ['K'])).toBe(true);
  });

  it('returns true for lubricative (L) characteristic', () => {
    expect(isPeakTypeMucus('6', ['L'])).toBe(true);
  });

  it('returns false for non-peak mucus', () => {
    expect(isPeakTypeMucus('6', ['C'])).toBe(false);
  });

  it('returns false for dry (0)', () => {
    expect(isPeakTypeMucus('0')).toBe(false);
  });

  it('returns false for no stretch', () => {
    expect(isPeakTypeMucus()).toBe(false);
  });

  it('returns false for 2W (not numeric enough for peak)', () => {
    expect(isPeakTypeMucus('2W')).toBe(false);
  });
});
