import { describe, it, expect } from 'vitest';
import { determineStamp, getStampLabel, isBabyStamp, hasPeakTypeMucus } from '../stamp-logic';
import type { Observation } from '../../db/models';

function obs(overrides: Partial<Observation> = {}): Observation {
  return { date: '2026-01-15', isPeakDay: false, ...overrides };
}

describe('determineStamp', () => {
  it('returns stampOverride when set', () => {
    expect(determineStamp(obs({ stampOverride: 'yellow' }))).toBe('yellow');
  });

  it('returns whiteBabyP for peak day', () => {
    expect(determineStamp(obs({ isPeakDay: true }))).toBe('whiteBabyP');
  });

  it('peak day wins over a yellow stampOverride', () => {
    expect(determineStamp(obs({ isPeakDay: true, stampOverride: 'yellow' }))).toBe('whiteBabyP');
  });

  it('BIP on a post-peak count day yields yellow-with-count (yellowBaby{N})', () => {
    expect(determineStamp(obs({ stampOverride: 'yellow' }), { postPeakCount: 1 })).toBe('yellowBaby1');
    expect(determineStamp(obs({ stampOverride: 'yellow', mucusStretch: '6' }), { postPeakCount: 2 })).toBe('yellowBaby2');
    expect(determineStamp(obs({ stampOverride: 'yellow' }), { postPeakCount: 3 })).toBe('yellowBaby3');
  });

  it('returns red for heavy bleeding', () => {
    expect(determineStamp(obs({ bleeding: 'H' }))).toBe('red');
  });

  it('returns red for moderate bleeding', () => {
    expect(determineStamp(obs({ bleeding: 'M' }))).toBe('red');
  });

  it('returns red for light bleeding', () => {
    expect(determineStamp(obs({ bleeding: 'L' }))).toBe('red');
  });

  it('returns red for very light bleeding', () => {
    expect(determineStamp(obs({ bleeding: 'VL' }))).toBe('red');
  });

  it('returns red for brown bleeding', () => {
    expect(determineStamp(obs({ brown: true }))).toBe('red');
  });

  it('returns whiteBaby for any mucus day', () => {
    expect(determineStamp(obs({ mucusStretch: '6' }))).toBe('whiteBaby');
    expect(determineStamp(obs({ mucusStretch: '8' }))).toBe('whiteBaby');
    expect(determineStamp(obs({ mucusStretch: '10' }))).toBe('whiteBaby');
    expect(determineStamp(obs({ mucusStretch: '6' }), { inFertileWindow: true })).toBe('whiteBaby');
  });

  it('returns green for non-mucus codes (0, 2, 2W, 4)', () => {
    expect(determineStamp(obs({ mucusStretch: '0' }))).toBe('green');
    expect(determineStamp(obs({ mucusStretch: '2' }))).toBe('green');
    expect(determineStamp(obs({ mucusStretch: '2W' }))).toBe('green');
    expect(determineStamp(obs({ mucusStretch: '4' }))).toBe('green');
  });

  it('returns green for no observations', () => {
    expect(determineStamp(obs())).toBe('green');
  });

  it('returns greenBaby for non-mucus day in fertile window', () => {
    expect(determineStamp(obs(), { inFertileWindow: true })).toBe('greenBaby');
    expect(determineStamp(obs({ mucusStretch: '4' }), { inFertileWindow: true })).toBe('greenBaby');
  });

  it('returns greenBaby1 for dry post-peak day 1', () => {
    expect(determineStamp(obs(), { postPeakCount: 1 })).toBe('greenBaby1');
  });

  it('returns greenBaby2 for non-mucus post-peak day 2', () => {
    expect(determineStamp(obs({ mucusStretch: '4' }), { postPeakCount: 2 })).toBe('greenBaby2');
  });

  it('returns whiteBaby2 for mucus post-peak day 2', () => {
    expect(determineStamp(obs({ mucusStretch: '6' }), { postPeakCount: 2 })).toBe('whiteBaby2');
  });

  it('returns greenBaby1 for bleeding post-peak day 1', () => {
    expect(determineStamp(obs({ bleeding: 'L' }), { postPeakCount: 1 })).toBe('greenBaby1');
  });

  it('returns greenBaby3 for dry post-peak day 3', () => {
    expect(determineStamp(obs(), { postPeakCount: 3 })).toBe('greenBaby3');
  });
});

describe('getStampLabel', () => {
  it('returns empty for green', () => {
    expect(getStampLabel('green')).toBe('');
  });

  it('returns P for peak', () => {
    expect(getStampLabel('whiteBabyP')).toBe('P');
  });

  it('returns chick emoji for whiteBaby', () => {
    expect(getStampLabel('whiteBaby')).toBe('🐣');
  });

  it('returns count numbers', () => {
    expect(getStampLabel('whiteBaby1')).toBe('1');
    expect(getStampLabel('greenBaby2')).toBe('2');
    expect(getStampLabel('whiteBaby3')).toBe('3');
  });
});

describe('isBabyStamp', () => {
  it('returns true for baby stamps', () => {
    expect(isBabyStamp('whiteBaby')).toBe(true);
    expect(isBabyStamp('greenBaby1')).toBe(true);
    expect(isBabyStamp('yellowBaby')).toBe(true);
  });

  it('returns false for non-baby stamps', () => {
    expect(isBabyStamp('green')).toBe(false);
    expect(isBabyStamp('red')).toBe(false);
    expect(isBabyStamp('yellow')).toBe(false);
  });
});

describe('hasPeakTypeMucus', () => {
  it('returns true for stretchy (10+)', () => {
    expect(hasPeakTypeMucus('10')).toBe(true);
  });

  it('returns true for clear characteristic', () => {
    expect(hasPeakTypeMucus('6', ['K'])).toBe(true);
  });

  it('returns true for lubricative characteristic', () => {
    expect(hasPeakTypeMucus('4', ['L'])).toBe(true);
  });

  it('returns false for low stretch without peak chars', () => {
    expect(hasPeakTypeMucus('6', ['C'])).toBe(false);
  });

  it('returns false for no mucus', () => {
    expect(hasPeakTypeMucus()).toBe(false);
  });
});
