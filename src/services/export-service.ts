import { db } from '../db/database';
import type { Observation, Cycle } from '../db/models';
import { buildObservationCode } from '../utils/creighton-codes';
import { daysBetween } from '../utils/date-utils';

interface ExportData {
  version: number;
  exportDate: string;
  cycles: Cycle[];
  observations: Observation[];
}

export const exportService = {
  /** Export all data as JSON */
  async exportJSON(): Promise<string> {
    const cycles = await db.cycles.toArray();
    const observations = await db.observations.toArray();

    const data: ExportData = {
      version: 1,
      exportDate: new Date().toISOString(),
      cycles,
      observations,
    };

    return JSON.stringify(data, null, 2);
  },

  /** Export as CSV for practitioner sharing */
  async exportCSV(): Promise<string> {
    const observations = await db.observations.orderBy('date').toArray();
    const cycles = await db.cycles.orderBy('startDate').toArray();

    // Build cycle lookup by id
    const cycleMap = new Map<number, Cycle>();
    cycles.forEach((c, i) => {
      if (c.id) cycleMap.set(c.id, { ...c, notes: String(i + 1) }); // reuse notes field for cycle number
    });

    const lines = [
      'Date,Cycle #,Code,Stamp,Bleeding,Brown,Mucus Stretch,Mucus Chars,Frequency,Peak Day,Intercourse,Notes',
    ];

    for (const obs of observations) {
      const code = buildObservationCode(
        obs.bleeding,
        obs.mucusStretch,
        obs.mucusCharacteristics,
        obs.frequency,
        obs.brown
      );
      const cycle = obs.cycleId ? cycleMap.get(obs.cycleId) : undefined;
      const row = [
        obs.date,
        cycle?.notes ?? '', // cycle number
        `"${code}"`,
        obs.stamp ?? '',
        obs.bleeding ?? '',
        obs.brown ? 'Y' : '',
        obs.mucusStretch ?? '',
        obs.mucusCharacteristics?.join('') ?? '',
        obs.frequency ?? '',
        obs.isPeakDay ? 'Y' : '',
        obs.intercourse ? 'Y' : '',
        `"${(obs.notes ?? '').replace(/"/g, '""')}"`,
      ];
      lines.push(row.join(','));
    }

    // Cycle summary section
    lines.push('');
    lines.push('Cycle Summary');
    lines.push('Cycle #,Start Date,End Date,Length (days),Peak Day,Peak Day #,Post-Peak Length');

    cycles.forEach((cycle, i) => {
      const peakDayNum = cycle.peakDay ? daysBetween(cycle.startDate, cycle.peakDay) + 1 : '';
      const postPeakLength = (cycle.peakDay && cycle.length)
        ? cycle.length - (daysBetween(cycle.startDate, cycle.peakDay) + 1)
        : '';
      lines.push([
        i + 1,
        cycle.startDate,
        cycle.endDate ?? '(current)',
        cycle.length ?? '',
        cycle.peakDay ?? '',
        peakDayNum,
        postPeakLength,
      ].join(','));
    });

    return lines.join('\n');
  },

  /** Import data from JSON */
  async importJSON(jsonStr: string): Promise<{ cycles: number; observations: number }> {
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      throw new Error('File is not valid JSON');
    }

    const data = parsed as Record<string, unknown>;

    if (typeof data !== 'object' || data === null || !('version' in data) || !('observations' in data)) {
      throw new Error('Invalid export file format');
    }
    if (!Array.isArray(data.observations)) {
      throw new Error('Invalid export file: observations must be an array');
    }

    // Validate each observation has required fields and valid types
    const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
    const VALID_BLEEDING = new Set(['H', 'M', 'L', 'VL']);
    const VALID_STRETCH = new Set(['0', '2', '2W', '4', '6', '8', '10', '10DL', '10SL', '10WL']);
    const VALID_CHARS = new Set(['C', 'K', 'L', 'B', 'G', 'Y']);
    const VALID_FREQ = new Set(['x1', 'x2', 'x3', 'AD']);

    for (let i = 0; i < (data.observations as unknown[]).length; i++) {
      const obs = (data.observations as Record<string, unknown>[])[i];
      if (typeof obs !== 'object' || obs === null) {
        throw new Error(`Observation at index ${i} is not an object`);
      }
      if (typeof obs.date !== 'string' || !DATE_RE.test(obs.date)) {
        throw new Error(`Observation at index ${i} has invalid date: ${String(obs.date)}`);
      }
      if (obs.bleeding !== undefined && !VALID_BLEEDING.has(obs.bleeding as string)) {
        throw new Error(`Observation at index ${i} has invalid bleeding code: ${String(obs.bleeding)}`);
      }
      if (obs.mucusStretch !== undefined && !VALID_STRETCH.has(obs.mucusStretch as string)) {
        throw new Error(`Observation at index ${i} has invalid mucus stretch code: ${String(obs.mucusStretch)}`);
      }
      if (obs.mucusCharacteristics !== undefined) {
        if (!Array.isArray(obs.mucusCharacteristics)) {
          throw new Error(`Observation at index ${i} has invalid mucus characteristics`);
        }
        for (const c of obs.mucusCharacteristics) {
          if (!VALID_CHARS.has(c as string)) {
            throw new Error(`Observation at index ${i} has invalid mucus characteristic: ${String(c)}`);
          }
        }
      }
      if (obs.frequency !== undefined && !VALID_FREQ.has(obs.frequency as string)) {
        throw new Error(`Observation at index ${i} has invalid frequency: ${String(obs.frequency)}`);
      }
    }

    if (data.cycles !== undefined && !Array.isArray(data.cycles)) {
      throw new Error('Invalid export file: cycles must be an array');
    }
    if (Array.isArray(data.cycles)) {
      for (let i = 0; i < data.cycles.length; i++) {
        const cycle = data.cycles[i] as Record<string, unknown>;
        if (typeof cycle !== 'object' || cycle === null) {
          throw new Error(`Cycle at index ${i} is not an object`);
        }
        if (typeof cycle.startDate !== 'string' || !DATE_RE.test(cycle.startDate)) {
          throw new Error(`Cycle at index ${i} has invalid startDate: ${String(cycle.startDate)}`);
        }
      }
    }

    // Safe to cast after validation above
    const validatedData = data as unknown as ExportData;

    let cycleCount = 0;
    let obsCount = 0;

    await db.transaction('rw', db.cycles, db.observations, async () => {
      // Import cycles
      if (validatedData.cycles) {
        for (const cycle of validatedData.cycles) {
          const existing = await db.cycles
            .where('startDate')
            .equals(cycle.startDate)
            .first();
          if (!existing) {
            const { id: _id, ...rest } = cycle;
            await db.cycles.add(rest);
            cycleCount++;
          }
        }
      }

      // Import observations
      for (const obs of validatedData.observations) {
        const existing = await db.observations
          .where('date')
          .equals(obs.date)
          .first();
        if (!existing) {
          const { id: _id, ...rest } = obs;
          await db.observations.add(rest);
          obsCount++;
        }
      }
    });

    return { cycles: cycleCount, observations: obsCount };
  },

  /** Trigger browser download of a string as a file */
  downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  },
};
