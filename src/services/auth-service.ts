import { cryptoService } from './crypto-service';

export interface AuthState {
  loggedIn: boolean;
  email?: string;
  firstName?: string;
  userId?: number;
  emailVerified?: boolean;
}

export const authService = {
  state: { loggedIn: false } as AuthState,

  async checkAuth(): Promise<AuthState> {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        this.state = { loggedIn: true, email: data.email, firstName: data.firstName, userId: data.id, emailVerified: data.emailVerified };
      } else {
        this.state = { loggedIn: false };
        cryptoService.clearKey();
      }
    } catch {
      this.state = { loggedIn: false };
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
  },
};
