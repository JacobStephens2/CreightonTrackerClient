import Dexie, { type Table } from 'dexie';
import type { Observation, Cycle, UserSettings } from './models';

export class CreightonDB extends Dexie {
  observations!: Table<Observation, number>;
  cycles!: Table<Cycle, number>;
  settings!: Table<UserSettings, number>;

  constructor() {
    super('CreightonTracker');

    this.version(1).stores({
      observations: '++id, &date, cycleId',
      cycles: '++id, startDate',
      settings: 'id',
    });
  }
}

export const db = new CreightonDB();

/** Ensure default settings exist */
export async function initSettings(): Promise<void> {
  const existing = await db.settings.get(1);
  if (!existing) {
    await db.settings.put({
      id: 1,
      defaultView: 'chart',
    });
  }
}
