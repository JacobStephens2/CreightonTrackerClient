import type { Observation, Cycle, StampType } from '../db/models';
import { addDays } from './date-utils';

/**
 * Generate sample chart data for new users.
 * Returns two complete cycles with realistic Creighton observations
 * so users can see what a populated chart looks like.
 */
export function generateSampleData(): { cycles: Cycle[]; observationsByCycle: Map<number, Observation[]> } {
  // Anchor cycle 1 at a fixed past date (60 days ago from a reference)
  const cycle1Start = '2025-01-01';
  const cycle1Length = 29;
  const cycle1End = addDays(cycle1Start, cycle1Length);

  const cycle2Start = cycle1End;
  const cycle2Length = 31;
  const cycle2End = addDays(cycle2Start, cycle2Length);

  const cycles: Cycle[] = [
    { id: 1, startDate: cycle1Start, endDate: cycle1End, peakDay: addDays(cycle1Start, 13), length: cycle1Length },
    { id: 2, startDate: cycle2Start, endDate: cycle2End, peakDay: addDays(cycle2Start, 15), length: cycle2Length },
  ];

  // Cycle 1 observations: 29-day cycle, peak on day 14
  const c1Obs: Array<Partial<Observation> & { dayOffset: number; stamp: StampType }> = [
    { dayOffset: 0, bleeding: 'H', mucusStretch: '0', frequency: 'x3', stamp: 'red' },
    { dayOffset: 1, bleeding: 'M', mucusStretch: '0', frequency: 'x3', stamp: 'red' },
    { dayOffset: 2, bleeding: 'M', mucusStretch: '0', frequency: 'x2', stamp: 'red' },
    { dayOffset: 3, bleeding: 'L', mucusStretch: '0', frequency: 'x1', stamp: 'red' },
    { dayOffset: 4, bleeding: 'VL', mucusStretch: '0', frequency: 'x1', stamp: 'red' },
    { dayOffset: 5, mucusStretch: '0', frequency: 'x1', stamp: 'green' },
    { dayOffset: 6, mucusStretch: '0', frequency: 'x1', stamp: 'green' },
    { dayOffset: 7, mucusStretch: '0', frequency: 'x1', stamp: 'green' },
    { dayOffset: 8, mucusStretch: '2', mucusCharacteristics: ['C'], frequency: 'x1', stamp: 'whiteBaby' },
    { dayOffset: 9, mucusStretch: '4', mucusCharacteristics: ['C', 'K'], frequency: 'x2', stamp: 'whiteBaby' },
    { dayOffset: 10, mucusStretch: '6', mucusCharacteristics: ['K'], frequency: 'x2', stamp: 'whiteBaby' },
    { dayOffset: 11, mucusStretch: '8', mucusCharacteristics: ['K', 'L'], frequency: 'x2', stamp: 'whiteBaby' },
    { dayOffset: 12, mucusStretch: '10', mucusCharacteristics: ['K', 'L'], frequency: 'x3', stamp: 'whiteBaby' },
    { dayOffset: 13, mucusStretch: '10', mucusCharacteristics: ['K', 'L'], frequency: 'AD', stamp: 'whiteBabyP', isPeakDay: true },
    { dayOffset: 14, mucusStretch: '0', frequency: 'x1', stamp: 'greenBaby1' },
    { dayOffset: 15, mucusStretch: '0', frequency: 'x1', stamp: 'greenBaby2' },
    { dayOffset: 16, mucusStretch: '0', frequency: 'x1', stamp: 'greenBaby3' },
    { dayOffset: 17, mucusStretch: '0', frequency: 'x1', stamp: 'green' },
    { dayOffset: 18, mucusStretch: '0', frequency: 'x1', stamp: 'green' },
    { dayOffset: 19, mucusStretch: '0', frequency: 'x1', stamp: 'green' },
    { dayOffset: 20, mucusStretch: '0', frequency: 'x1', stamp: 'green' },
    { dayOffset: 21, mucusStretch: '0', frequency: 'x1', stamp: 'green' },
    { dayOffset: 22, mucusStretch: '0', frequency: 'x1', stamp: 'green' },
    { dayOffset: 23, mucusStretch: '0', frequency: 'x1', stamp: 'green' },
    { dayOffset: 24, mucusStretch: '0', frequency: 'x1', stamp: 'green' },
    { dayOffset: 25, mucusStretch: '0', frequency: 'x1', stamp: 'green' },
    { dayOffset: 26, mucusStretch: '0', frequency: 'x1', stamp: 'green' },
    { dayOffset: 27, mucusStretch: '0', frequency: 'x1', stamp: 'green' },
    { dayOffset: 28, mucusStretch: '0', frequency: 'x1', stamp: 'green' },
  ];

  // Cycle 2 observations: 31-day cycle, peak on day 16
  const c2Obs: Array<Partial<Observation> & { dayOffset: number; stamp: StampType }> = [
    { dayOffset: 0, bleeding: 'H', mucusStretch: '0', frequency: 'x3', stamp: 'red' },
    { dayOffset: 1, bleeding: 'H', mucusStretch: '0', frequency: 'x3', stamp: 'red' },
    { dayOffset: 2, bleeding: 'M', mucusStretch: '0', frequency: 'x2', stamp: 'red' },
    { dayOffset: 3, bleeding: 'L', mucusStretch: '0', frequency: 'x2', stamp: 'red' },
    { dayOffset: 4, bleeding: 'VL', mucusStretch: '0', frequency: 'x1', stamp: 'red' },
    { dayOffset: 5, brown: true, mucusStretch: '0', frequency: 'x1', stamp: 'red' },
    { dayOffset: 6, mucusStretch: '0', frequency: 'x1', stamp: 'green' },
    { dayOffset: 7, mucusStretch: '0', frequency: 'x1', stamp: 'green' },
    { dayOffset: 8, mucusStretch: '0', frequency: 'x1', stamp: 'green' },
    { dayOffset: 9, mucusStretch: '0', frequency: 'x1', stamp: 'green' },
    { dayOffset: 10, mucusStretch: '2', mucusCharacteristics: ['C'], frequency: 'x1', stamp: 'whiteBaby' },
    { dayOffset: 11, mucusStretch: '2W', mucusCharacteristics: ['C'], frequency: 'x2', stamp: 'whiteBaby' },
    { dayOffset: 12, mucusStretch: '4', mucusCharacteristics: ['C', 'K'], frequency: 'x2', stamp: 'whiteBaby' },
    { dayOffset: 13, mucusStretch: '8', mucusCharacteristics: ['K', 'L'], frequency: 'x2', stamp: 'whiteBaby' },
    { dayOffset: 14, mucusStretch: '10', mucusCharacteristics: ['K', 'L'], frequency: 'x3', stamp: 'whiteBaby' },
    { dayOffset: 15, mucusStretch: '10', mucusCharacteristics: ['K', 'L'], frequency: 'AD', stamp: 'whiteBabyP', isPeakDay: true },
    { dayOffset: 16, mucusStretch: '0', frequency: 'x1', stamp: 'greenBaby1' },
    { dayOffset: 17, mucusStretch: '2', mucusCharacteristics: ['C'], frequency: 'x1', stamp: 'whiteBaby2' },
    { dayOffset: 18, mucusStretch: '0', frequency: 'x1', stamp: 'greenBaby3' },
    { dayOffset: 19, mucusStretch: '0', frequency: 'x1', stamp: 'green' },
    { dayOffset: 20, mucusStretch: '0', frequency: 'x1', stamp: 'green' },
    { dayOffset: 21, mucusStretch: '0', frequency: 'x1', stamp: 'green' },
    { dayOffset: 22, mucusStretch: '0', frequency: 'x1', stamp: 'green' },
    { dayOffset: 23, mucusStretch: '0', frequency: 'x1', stamp: 'green' },
    { dayOffset: 24, mucusStretch: '0', frequency: 'x1', stamp: 'green' },
    { dayOffset: 25, mucusStretch: '0', frequency: 'x1', stamp: 'green' },
    { dayOffset: 26, mucusStretch: '0', frequency: 'x1', stamp: 'green' },
    { dayOffset: 27, mucusStretch: '0', frequency: 'x1', stamp: 'green' },
    { dayOffset: 28, mucusStretch: '0', frequency: 'x1', stamp: 'green' },
    { dayOffset: 29, mucusStretch: '0', frequency: 'x1', stamp: 'green' },
    { dayOffset: 30, mucusStretch: '0', frequency: 'x1', stamp: 'green' },
  ];

  function buildObservations(
    rawObs: Array<Partial<Observation> & { dayOffset: number; stamp: StampType }>,
    cycleStart: string,
    cycleId: number
  ): Observation[] {
    return rawObs.map((o, i) => ({
      id: cycleId * 100 + i,
      date: addDays(cycleStart, o.dayOffset),
      cycleId,
      bleeding: o.bleeding as Observation['bleeding'],
      mucusStretch: o.mucusStretch as Observation['mucusStretch'],
      mucusCharacteristics: o.mucusCharacteristics as Observation['mucusCharacteristics'],
      frequency: o.frequency as Observation['frequency'],
      isPeakDay: o.isPeakDay ?? false,
      stamp: o.stamp,
    }));
  }

  const observationsByCycle = new Map<number, Observation[]>();
  observationsByCycle.set(1, buildObservations(c1Obs, cycle1Start, 1));
  observationsByCycle.set(2, buildObservations(c2Obs, cycle2Start, 2));

  return { cycles, observationsByCycle };
}
