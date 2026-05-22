import { db } from '../db/database';
import type { Cycle, Observation } from '../db/models';
import { daysBetween } from '../utils/date-utils';
import { determineStamp, hasPeakTypeMucus } from '../utils/stamp-logic';

export const cycleService = {
  /** Get all cycles ordered by start date */
  async getAll(): Promise<Cycle[]> {
    return db.cycles.orderBy('startDate').toArray();
  },

  /** Get a cycle by ID */
  async getById(id: number): Promise<Cycle | undefined> {
    return db.cycles.get(id);
  },

  /** Evaluate all observations and auto-detect cycle boundaries.
   *  A new cycle starts when bleeding (H, M, L) occurs after at least 3
   *  consecutive non-bleeding observations, or after a 14+ day gap since
   *  the last bleeding observation (sparse entry). */
  async evaluateCycles(): Promise<void> {
    const allObs = await db.observations.orderBy('date').toArray();
    if (allObs.length === 0) return;

    const cycles: { startDate: string; endDate?: string }[] = [];
    let currentCycleStart: string | null = null;
    let currentCycleManual = false;
    let consecutiveNonBleeding = 0;
    let lastBleedingDate: string | null = null;

    for (const obs of allObs) {
      const isBleeding = !!obs.bleeding && ['H', 'M', 'L'].includes(obs.bleeding);

      if (currentCycleStart === null) {
        // First observation starts first cycle
        currentCycleStart = obs.date;
        currentCycleManual = obs.isCycleStart === true;
        if (isBleeding) {
          lastBleedingDate = obs.date;
          consecutiveNonBleeding = 0;
        } else {
          consecutiveNonBleeding = 1;
        }
        continue;
      }

      const daysSinceLastBleeding = lastBleedingDate
        ? daysBetween(lastBleedingDate, obs.date)
        : Infinity;

      // Manual override: user-flagged cycle start always forces a boundary
      const manualStart = obs.isCycleStart === true;

      // If the current cycle was started by a manual flag, suppress auto-
      // detection within the first 14 days so the next bleeding episode
      // doesn't create a spurious sub-14-day "cycle". Auto-only cycles use
      // the normal rules (which also handle data that starts mid-cycle).
      const cycleAgeDays = daysBetween(currentCycleStart, obs.date);
      const autoBlocked = currentCycleManual && cycleAgeDays < 14;
      const autoStart =
        isBleeding &&
        !autoBlocked &&
        (consecutiveNonBleeding >= 3 || daysSinceLastBleeding >= 14);

      // New cycle if manually flagged, or auto-detected
      if (manualStart || autoStart) {
        cycles.push({ startDate: currentCycleStart });
        currentCycleStart = obs.date;
        currentCycleManual = manualStart;
        consecutiveNonBleeding = 0;
      }

      if (isBleeding) {
        lastBleedingDate = obs.date;
        consecutiveNonBleeding = 0;
      } else {
        consecutiveNonBleeding++;
      }
    }

    // Push the last/current cycle
    if (currentCycleStart) {
      cycles.push({ startDate: currentCycleStart });
    }

    // Set end dates (day before next cycle starts)
    for (let i = 0; i < cycles.length - 1; i++) {
      cycles[i].endDate = cycles[i + 1].startDate;
    }

    // Sync with database
    const existingCycles = await db.cycles.orderBy('startDate').toArray();

    await db.transaction('rw', db.cycles, db.observations, async () => {
      // Remove cycles that no longer match
      for (const ec of existingCycles) {
        const match = cycles.find(c => c.startDate === ec.startDate);
        if (!match) {
          await db.cycles.delete(ec.id!);
        }
      }

      // Add or update cycles
      for (const c of cycles) {
        const existing = existingCycles.find(ec => ec.startDate === c.startDate);
        if (existing) {
          const length = c.endDate ? daysBetween(c.startDate, c.endDate) : undefined;
          await db.cycles.update(existing.id!, {
            endDate: c.endDate,
            length,
          });
          // Assign cycleId to observations
          await this.assignObservationsToCycle(existing.id!, c.startDate, c.endDate);
        } else {
          const length = c.endDate ? daysBetween(c.startDate, c.endDate) : undefined;
          const id = await db.cycles.add({
            startDate: c.startDate,
            endDate: c.endDate,
            length,
          });
          await this.assignObservationsToCycle(id as number, c.startDate, c.endDate);
        }
      }
    });

    // Detect peak days for each cycle
    await this.detectPeakDays();

    // Recompute stamps for every observation using the fresh cycle/peak state
    await this.recomputeStamps();
  },

  /** Assign observations within a date range to a cycle */
  async assignObservationsToCycle(cycleId: number, startDate: string, endDate?: string): Promise<void> {
    let obs: Observation[];
    if (endDate) {
      obs = await db.observations
        .where('date')
        .between(startDate, endDate, true, false)
        .toArray();
    } else {
      obs = await db.observations
        .where('date')
        .aboveOrEqual(startDate)
        .toArray();
    }
    for (const o of obs) {
      await db.observations.update(o.id!, { cycleId });
    }
  },

  /** Auto-detect peak days. Rules:
   *   1. If any observation in the cycle has isPeakDay=true, that date wins.
   *   2. Otherwise, peak is the last peak-type mucus day that is followed by
   *      at least one non-peak-type observation within the same cycle (the
   *      Creighton "change" criterion). If the last peak-type day has no
   *      non-peak follow-up, peak isn't established yet and is cleared. */
  async detectPeakDays(): Promise<void> {
    const cycles = await db.cycles.toArray();
    for (const cycle of cycles) {
      const obs = await db.observations
        .where('cycleId')
        .equals(cycle.id!)
        .sortBy('date');

      // Use the LATEST manually flagged peak as the cycle's summary peakDay
      // (relevant for chart-label display). getStampContext still considers
      // every manually flagged peak when computing per-day stamps, so any
      // earlier peak still drives its own post-peak count.
      const userPeaks = obs.filter(o => o.isPeakDay);
      if (userPeaks.length > 0) {
        await db.cycles.update(cycle.id!, { peakDay: userPeaks[userPeaks.length - 1].date });
        continue;
      }

      let lastPeakTypeIdx = -1;
      for (let i = 0; i < obs.length; i++) {
        if (hasPeakTypeMucus(obs[i].mucusStretch, obs[i].mucusCharacteristics)) {
          lastPeakTypeIdx = i;
        }
      }

      const confirmed =
        lastPeakTypeIdx >= 0 &&
        lastPeakTypeIdx < obs.length - 1 &&
        !hasPeakTypeMucus(
          obs[lastPeakTypeIdx + 1].mucusStretch,
          obs[lastPeakTypeIdx + 1].mucusCharacteristics
        );

      if (confirmed) {
        await db.cycles.update(cycle.id!, { peakDay: obs[lastPeakTypeIdx].date });
      } else if (cycle.peakDay) {
        await db.cycles.where('id').equals(cycle.id!).modify(c => { delete c.peakDay; });
      }
    }
  },

  /** Recompute stamps on every observation using the current cycle/peak state.
   *  Called at the end of evaluateCycles so stamps never go stale when cycle
   *  boundaries or peak days shift. */
  async recomputeStamps(): Promise<void> {
    const allObs = await db.observations.toArray();
    for (const o of allObs) {
      const context = await this.getStampContext(o.date);
      const newStamp = determineStamp(o, context);
      if (newStamp !== o.stamp) {
        await db.observations.update(o.id!, { stamp: newStamp });
      }
    }
  },

  /** Get stamp context for a given date (peak day info, post-peak count).
   *  Supports multiple peak days per cycle ("double peak"): each manually
   *  flagged peak gets its own 3-day post-peak count, computed against the
   *  most recent peak that is on or before the given date. */
  async getStampContext(date: string): Promise<{
    peakDay?: string;
    postPeakCount?: number;
    inFertileWindow?: boolean;
    pastPostPeakWindow?: boolean;
  }> {
    const obs = await db.observations.where('date').equals(date).first();
    if (!obs?.cycleId) return {};

    const cycle = await db.cycles.get(obs.cycleId);
    if (!cycle) return {};

    const cycleObs = await db.observations
      .where('cycleId')
      .equals(obs.cycleId)
      .sortBy('date');

    // Collect every peak date in this cycle. Manual peaks (isPeakDay=true)
    // win; if none, fall back to the auto-detected cycle.peakDay.
    let peakDates = cycleObs.filter(o => o.isPeakDay).map(o => o.date);
    if (peakDates.length === 0 && cycle.peakDay) peakDates = [cycle.peakDay];
    peakDates.sort();

    const mucusStarted = () =>
      cycleObs.some(o => o.date <= date && o.mucusStretch && o.mucusStretch !== '0');

    if (peakDates.length === 0) {
      return mucusStarted() ? { inFertileWindow: true } : {};
    }

    // Today is itself a peak day
    if (peakDates.includes(date)) return { peakDay: date };

    // Most recent peak strictly before today
    const priorPeaks = peakDates.filter(p => p < date);
    if (priorPeaks.length > 0) {
      const lastPriorPeak = priorPeaks[priorPeaks.length - 1];
      const daysAfter = daysBetween(lastPriorPeak, date);
      if (daysAfter > 0 && daysAfter <= 3) {
        return { peakDay: lastPriorPeak, postPeakCount: daysAfter };
      }
      if (daysAfter > 3) {
        return { peakDay: lastPriorPeak, pastPostPeakWindow: true };
      }
    }

    // Before the first peak — fertile-window flag if mucus has started
    return mucusStarted() ? { inFertileWindow: true } : {};
  },
};
