import { db } from '../db/database';
import { cycleService } from './cycle-service';
import { cryptoService } from './crypto-service';
import { authService } from './auth-service';
import { showToast } from '../utils/toast';

const SYNC_PENDING_KEY = 'syncPending';
const SHARE_KEY_STORAGE = 'shareKey';
const MAX_RETRIES = 3;
const RETRY_DELAYS = [2000, 5000, 15000]; // exponential-ish backoff

export interface SyncDiff {
  /** Whether the server has a snapshot at all for this account. */
  hasServerData: boolean;
  onlyLocal: string[];   // observation dates on this device but NOT on the server
  onlyServer: string[];  // observation dates on the server but NOT on this device
  changed: string[];     // dates present in both whose recorded values differ
  inSync: boolean;       // no differences at all
  /** True when pulling the server copy would discard local entries/edits. */
  riskOfLocalLoss: boolean;
  localCount: number;
  serverCount: number;
  serverUpdatedAt?: string;
}

type RemoteSnapshot = {
  observations: Record<string, unknown>[];
  cycles: Record<string, unknown>[];
  settings: unknown;
  updatedAt?: string;
};

/** Canonical, comparable signature of an observation's recorded values —
 *  ignores id/cycleId (re-derived) and stamp (computed). */
function obsSignature(o: Record<string, unknown>): string {
  const chars = Array.isArray(o.mucusCharacteristics) ? [...(o.mucusCharacteristics as string[])].sort() : [];
  return JSON.stringify({
    bleeding: o.bleeding ?? null,
    brown: !!o.brown,
    mucusStretch: o.mucusStretch ?? null,
    mucusCharacteristics: chars,
    frequency: o.frequency ?? null,
    isPeakDay: !!o.isPeakDay,
    isCycleStart: !!o.isCycleStart,
    stampOverride: o.stampOverride ?? null,
    intercourse: !!o.intercourse,
    notes: typeof o.notes === 'string' ? o.notes.trim() : '',
  });
}

export const syncService = {
  _retryTimer: 0 as ReturnType<typeof setTimeout> | number,

  async upload(retryCount = 0): Promise<void> {
    const observations = await db.observations.toArray();
    const cycles = await db.cycles.toArray();
    const settings = await db.settings.get(1);

    let body: string;

    if (cryptoService.hasKey()) {
      // E2E encrypted upload
      const plaintext = JSON.stringify({ observations, cycles, settings: settings || null });
      const encryptedData = await cryptoService.encrypt(plaintext);

      // Zero-knowledge provider share: only when the user has created a share
      // link (a per-share key exists locally) do we attach an encrypted
      // projection. It is encrypted under that random key — which lives only in
      // the share URL fragment, never sent to the server. Strip notes (free
      // text); keep intercourse so providers see the indicators. firstName
      // travels inside the encrypted blob so the server never sees it either.
      let shareData: string | undefined;
      const shareKey = localStorage.getItem(SHARE_KEY_STORAGE);
      if (shareKey) {
        const shareObservations = observations.map(({ notes, ...safe }) => safe);
        const shareProjection = JSON.stringify({
          firstName: authService.state.firstName || '',
          observations: shareObservations,
          cycles,
        });
        shareData = await cryptoService.encryptWithKey(shareProjection, shareKey);
      }

      body = JSON.stringify(shareData ? { encryptedData, shareData } : { encryptedData });
    } else {
      // Legacy plaintext upload (pre-E2E migration)
      body = JSON.stringify({ observations, cycles, settings });
    }

    try {
      const res = await fetch('/api/sync/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Sync upload failed');
      }

      localStorage.setItem('lastSyncTime', new Date().toISOString());
      localStorage.removeItem(SYNC_PENDING_KEY);
    } catch (err) {
      // Mark as pending for offline queue
      localStorage.setItem(SYNC_PENDING_KEY, 'true');

      if (retryCount < MAX_RETRIES) {
        clearTimeout(this._retryTimer as ReturnType<typeof setTimeout>);
        this._retryTimer = setTimeout(() => {
          this.upload(retryCount + 1);
        }, RETRY_DELAYS[retryCount]);
      } else {
        throw err;
      }
    }
  },

  /** Flush any pending sync when we come back online */
  flushPending(): void {
    if (localStorage.getItem(SYNC_PENDING_KEY)) {
      this.upload().then(() => {
        showToast('Data synced successfully', 'success');
      }).catch(() => {});
    }
  },

  /**
   * Fetch and decrypt the server snapshot WITHOUT touching local data.
   * Returns null when the account has no snapshot yet (HTTP 404).
   */
  async fetchRemote(): Promise<RemoteSnapshot | null> {
    const res = await fetch('/api/sync/download');
    if (res.status === 404) return null;
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Could not read server data');
    }

    const responseData = await res.json();
    let data: { observations?: unknown[]; cycles?: unknown[]; settings?: unknown };

    if (responseData.e2e) {
      if (!cryptoService.hasKey()) {
        throw new Error('Please sign out and back in to access your encrypted data');
      }
      const plaintext = await cryptoService.decrypt(responseData.encryptedData);
      data = JSON.parse(plaintext);
    } else {
      data = responseData;
    }

    return {
      observations: (data.observations as Record<string, unknown>[]) || [],
      cycles: (data.cycles as Record<string, unknown>[]) || [],
      settings: data.settings ?? null,
      updatedAt: responseData.updatedAt,
    };
  },

  /**
   * Compare local data against the server snapshot, non-destructively.
   * Observations are the source of truth (cycles are re-derived), so the
   * diff is computed per observation date.
   */
  async diffWithServer(): Promise<SyncDiff> {
    const remote = await this.fetchRemote();
    const localObs = await db.observations.toArray();
    const localByDate = new Map(localObs.map((o) => [o.date, o as unknown as Record<string, unknown>]));

    if (!remote) {
      const onlyLocal = [...localByDate.keys()].sort();
      return {
        hasServerData: false,
        onlyLocal,
        onlyServer: [],
        changed: [],
        inSync: onlyLocal.length === 0,
        riskOfLocalLoss: onlyLocal.length > 0,
        localCount: localObs.length,
        serverCount: 0,
      };
    }

    const remoteByDate = new Map(remote.observations.map((o) => [o.date as string, o]));
    const onlyLocal: string[] = [];
    const onlyServer: string[] = [];
    const changed: string[] = [];

    for (const [date, lo] of localByDate) {
      const ro = remoteByDate.get(date);
      if (!ro) onlyLocal.push(date);
      else if (obsSignature(lo) !== obsSignature(ro)) changed.push(date);
    }
    for (const date of remoteByDate.keys()) {
      if (!localByDate.has(date)) onlyServer.push(date);
    }
    onlyLocal.sort();
    onlyServer.sort();
    changed.sort();

    return {
      hasServerData: true,
      onlyLocal,
      onlyServer,
      changed,
      inSync: onlyLocal.length === 0 && onlyServer.length === 0 && changed.length === 0,
      riskOfLocalLoss: onlyLocal.length > 0 || changed.length > 0,
      localCount: localObs.length,
      serverCount: remote.observations.length,
      serverUpdatedAt: remote.updatedAt,
    };
  },

  /**
   * Non-destructive auto-sync for app start. Never silently overwrites either
   * side when both have unique data:
   *  - in sync                  → nothing
   *  - only local has extras    → upload (back it up; no server loss)
   *  - only server has extras   → download (pull; no local loss)
   *  - both diverge / changed   → conflict (caller resolves; nothing overwritten)
   */
  async safeAutoSync(): Promise<{ action: 'none' | 'uploaded' | 'downloaded' | 'conflict'; diff: SyncDiff }> {
    const diff = await this.diffWithServer();
    if (diff.inSync) return { action: 'none', diff };

    const riskLocalLoss = diff.onlyLocal.length > 0 || diff.changed.length > 0;
    const riskServerLoss = diff.onlyServer.length > 0 || diff.changed.length > 0;

    if (!diff.hasServerData) {
      await this.upload();
      return { action: 'uploaded', diff };
    }
    if (!riskServerLoss) {
      // Local is a superset — pushing it loses nothing on the server.
      await this.upload();
      return { action: 'uploaded', diff };
    }
    if (!riskLocalLoss) {
      // Server is a superset — pulling it loses nothing local.
      await this.download();
      return { action: 'downloaded', diff };
    }
    return { action: 'conflict', diff };
  },

  async download(): Promise<{ observations: number; cycles: number }> {
    const remote = await this.fetchRemote();
    if (!remote) {
      throw new Error('No synced data found. Sync your data first.');
    }
    const data: { observations: unknown[]; cycles?: unknown[]; settings?: unknown } = {
      observations: remote.observations,
      cycles: remote.cycles,
      settings: remote.settings,
    };

    await db.transaction('rw', db.observations, db.cycles, db.settings, async () => {
      await db.observations.clear();
      await db.cycles.clear();

      if (data.cycles) {
        for (const cycle of data.cycles as Record<string, unknown>[]) {
          const { id: _id, ...rest } = cycle;
          await db.cycles.add(rest as never);
        }
      }

      for (const obs of data.observations as Record<string, unknown>[]) {
        const { id: _id, ...rest } = obs;
        await db.observations.add(rest as never);
      }

      if (data.settings) {
        await db.settings.put({ ...(data.settings as Record<string, unknown>), id: 1 } as never);
      }
    });

    // Re-evaluate cycles to fix cycleId references
    await cycleService.evaluateCycles();

    localStorage.setItem('lastSyncTime', new Date().toISOString());
    return { observations: data.observations.length, cycles: data.cycles?.length || 0 };
  },

  getLastSyncTime(): string | null {
    return localStorage.getItem('lastSyncTime');
  },
};
