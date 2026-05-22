import { db } from '../db/database';
import type { Observation } from '../db/models';
import { determineStamp } from '../utils/stamp-logic';
import { cycleService } from './cycle-service';
import { authService } from './auth-service';
import { syncService } from './sync-service';
import { showToast } from '../utils/toast';

export const observationService = {
  /** Save or update an observation for a given date */
  async save(obs: Observation): Promise<void> {
    // Compute stamp
    const context = await cycleService.getStampContext(obs.date);
    obs.stamp = determineStamp(obs, context);

    const existing = await db.observations.where('date').equals(obs.date).first();
    if (existing) {
      await db.observations.where('id').equals(existing.id!).modify((_old) => {
        Object.assign(_old, obs);
      });
    } else {
      await db.observations.add(obs);
    }

    // Re-evaluate cycle boundaries
    await cycleService.evaluateCycles();

    // Background sync if logged in
    if (authService.state.loggedIn) {
      syncService.upload().catch(() => showToast('Sync failed — your data is saved locally', 'error'));
    }
  },

  /** Get observation for a specific date */
  async getByDate(date: string): Promise<Observation | undefined> {
    return db.observations.where('date').equals(date).first();
  },

  /** Get all observations in a date range (inclusive) */
  async getRange(startDate: string, endDate: string): Promise<Observation[]> {
    return db.observations
      .where('date')
      .between(startDate, endDate, true, true)
      .sortBy('date');
  },

  /** Get all observations for a cycle */
  async getByCycle(cycleId: number): Promise<Observation[]> {
    return db.observations
      .where('cycleId')
      .equals(cycleId)
      .sortBy('date');
  },

  /** Get all observations */
  async getAll(): Promise<Observation[]> {
    return db.observations.orderBy('date').toArray();
  },

  /** Delete an observation */
  async delete(date: string): Promise<void> {
    await db.observations.where('date').equals(date).delete();
    await cycleService.evaluateCycles();

    if (authService.state.loggedIn) {
      syncService.upload().catch(() => showToast('Sync failed — your data is saved locally', 'error'));
    }
  },

  /** Recompute stamps for all observations */
  async recomputeAllStamps(): Promise<void> {
    const all = await this.getAll();
    for (const obs of all) {
      const context = await cycleService.getStampContext(obs.date);
      obs.stamp = determineStamp(obs, context);
      await db.observations.update(obs.id!, { stamp: obs.stamp });
    }
  },
};
