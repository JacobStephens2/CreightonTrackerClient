import { cryptoService } from './crypto-service';

export interface AuthState {
  loggedIn: boolean;
  email?: string;
  firstName?: string;
  userId?: number;
  emailVerified?: boolean;
}

// Persisted hints (survive a lost session) so the app can tell the difference
// between "never signed in" and "signed in before, but the session is gone".
const AUTH_EXPECTED_KEY = 'authExpected';
const LAST_EMAIL_KEY = 'lastAccountEmail';
const LAST_NAME_KEY = 'lastAccountName';

/** Record that this device has an account and currently expects to be signed in. */
function rememberAccount(email?: string, firstName?: string): void {
  localStorage.setItem(AUTH_EXPECTED_KEY, '1');
  if (email) localStorage.setItem(LAST_EMAIL_KEY, email);
  if (firstName) localStorage.setItem(LAST_NAME_KEY, firstName);
}

/**
 * True when the user signed in on this device before and we still expect a
 * valid session — i.e. they did NOT deliberately sign out. Used to surface a
 * "you've been signed out" reminder when the session has silently expired.
 */
export function wasPreviouslyLoggedIn(): boolean {
  return localStorage.getItem(AUTH_EXPECTED_KEY) === '1';
}

/** The last account known on this device, for prefilling the sign-in form. */
export function getLastAccount(): { email?: string; firstName?: string } {
  return {
    email: localStorage.getItem(LAST_EMAIL_KEY) || undefined,
    firstName: localStorage.getItem(LAST_NAME_KEY) || undefined,
  };
}

// True only when the server explicitly told us the session is invalid this run
// (HTTP response, not a network error). Lets the UI flag a real sign-out while
// staying quiet when the app is simply offline — it's an offline-first PWA.
let sessionInvalidated = false;
export function wasSessionInvalidated(): boolean {
  return sessionInvalidated;
}

export const authService = {
  state: { loggedIn: false } as AuthState,

  async checkAuth(): Promise<AuthState> {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        this.state = { loggedIn: true, email: data.email, firstName: data.firstName, userId: data.id, emailVerified: data.emailVerified };
        rememberAccount(data.email, data.firstName);
        sessionInvalidated = false;
      } else {
        // Server says we're not authenticated. We intentionally DON'T clear the
        // "expected auth" hint here — that, plus this confirmed invalidation, is
        // the signal the UI uses to flag a silent sign-out.
        this.state = { loggedIn: false };
        cryptoService.clearKey();
        sessionInvalidated = true;
      }
    } catch {
      // Couldn't reach the server (offline / transient). Not a confirmed
      // sign-out — leave the reminder quiet so we don't false-alarm offline.
      this.state = { loggedIn: false };
      sessionInvalidated = false;
    }
    return this.state;
  },

  async login(email: string, password: string): Promise<void> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Login failed');
    }
    const data = await res.json();
    this.state = { loggedIn: true, email: data.email, firstName: data.firstName, userId: data.id, emailVerified: data.emailVerified };
    rememberAccount(data.email, data.firstName);

    // Derive and store E2E encryption key
    if (data.encryptionSalt) {
      await cryptoService.deriveAndStoreKey(password, data.encryptionSalt);
    }
  },

  async register(firstName: string, email: string, password: string): Promise<void> {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firstName, email, password }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Registration failed');
    }
    const data = await res.json();
    this.state = { loggedIn: true, email: data.email, firstName: data.firstName, userId: data.id, emailVerified: data.emailVerified };
    rememberAccount(data.email, data.firstName);

    // Derive and store E2E encryption key
    if (data.encryptionSalt) {
      await cryptoService.deriveAndStoreKey(password, data.encryptionSalt);
    }

    // Upload any existing local data to the new account
    const { syncService } = await import('./sync-service');
    const { showToast } = await import('../utils/toast');
    await syncService.upload().catch(() => showToast('Initial sync failed — your data is saved locally', 'error'));
  },

  async updateName(firstName: string): Promise<void> {
    const res = await fetch('/api/auth/me', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firstName }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Update failed');
    }
    this.state.firstName = firstName;
  },

  async verifyEmail(token: string): Promise<void> {
    const res = await fetch('/api/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Verification failed');
    }
    this.state.emailVerified = true;
  },

  async resendVerification(): Promise<void> {
    const res = await fetch('/api/auth/resend-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to resend');
    }
  },

  async forgotPassword(email: string): Promise<void> {
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Request failed');
    }
  },

  async resetPassword(token: string, password: string): Promise<void> {
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Reset failed');
    }
    const data = await res.json();
    if (data.id) {
      this.state = { loggedIn: true, email: data.email, firstName: data.firstName, userId: data.id };
      rememberAccount(data.email, data.firstName);

      // Derive new E2E key with new password and new salt
      if (data.encryptionSalt) {
        await cryptoService.deriveAndStoreKey(password, data.encryptionSalt);
      }
    }
  },

  async logout(): Promise<void> {
    await fetch('/api/auth/logout', { method: 'POST' });
    this.state = { loggedIn: false };
    cryptoService.clearKey();
    // Deliberate sign-out: drop the "expected auth" hint so we don't nag the
    // user to sign back in. Keep the last email around to prefill the form.
    localStorage.removeItem(AUTH_EXPECTED_KEY);
  },

  async deleteAccount(password: string): Promise<void> {
    const res = await fetch('/api/auth/me', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Account deletion failed');
    }
    this.state = { loggedIn: false };
    cryptoService.clearKey();
    // Account no longer exists — forget everything about it on this device.
    localStorage.removeItem(AUTH_EXPECTED_KEY);
    localStorage.removeItem(LAST_EMAIL_KEY);
    localStorage.removeItem(LAST_NAME_KEY);
  },
};
