import { cryptoService } from './crypto-service';
import { syncService } from './sync-service';

const SHARE_KEY_STORAGE = 'shareKey';

export const shareService = {
  getShareKey(): string | null {
    return localStorage.getItem(SHARE_KEY_STORAGE);
  },

  ensureShareKey(): string {
    let k = localStorage.getItem(SHARE_KEY_STORAGE);
    if (!k) {
      k = cryptoService.generateShareKey();
      localStorage.setItem(SHARE_KEY_STORAGE, k);
    }
    return k;
  },

  clearShareKey(): void {
    localStorage.removeItem(SHARE_KEY_STORAGE);
  },

  /** Append the local per-share key as a URL fragment. The server never sees
   *  it, so the link is only reconstructable on a device that holds the key.
   *  Returns null when this device has no key (e.g. share created elsewhere). */
  withKey(url: string): string | null {
    const k = this.getShareKey();
    return k ? `${url}#${k}` : null;
  },

  async getStatus(): Promise<{ active: boolean; token?: string; url?: string; createdAt?: string; expiresAt?: string }> {
    const res = await fetch('/api/share/status');
    if (!res.ok) throw new Error('Failed to check share status');
    return res.json();
  },

  async generate(): Promise<{ token: string; url: string; fullUrl: string; hasData: boolean; expiresAt: string }> {
    // 1. Ensure a per-share key exists locally (used to encrypt the projection).
    this.ensureShareKey();
    // 2. Push an encrypted share projection to the server under that key.
    await syncService.upload();
    // 3. Create/refresh the server-side token.
    const res = await fetch('/api/share/generate', { method: 'POST' });
    if (!res.ok) throw new Error('Failed to generate share link');
    const data = await res.json();
    return { ...data, fullUrl: `${data.url}#${this.getShareKey()}` };
  },

  async revoke(): Promise<void> {
    const res = await fetch('/api/share/revoke', { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to revoke share link');
    this.clearShareKey();
  },
};
