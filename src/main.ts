import './styles/global.css';
import './styles/stamps.css';
import './styles/chart.css';
import './styles/form.css';
import './styles/calendar.css';
import { initSettings, db } from './db/database';
import { initAppShell } from './components/app-shell';
import { updateAuthBanner } from './components/auth-banner';
import { authService } from './services/auth-service';
import { syncService } from './services/sync-service';
import { cycleService } from './services/cycle-service';
import { showToast } from './utils/toast';
import { initCookieConsent } from './utils/cookie-consent';

export function applyTheme(theme: 'light' | 'dark' | 'system' = 'system'): void {
  if (theme === 'system') {
    document.documentElement.removeAttribute('data-theme');
  } else {
    document.documentElement.setAttribute('data-theme', theme);
  }
}

async function main(): Promise<void> {
  await initSettings();

  // Apply saved theme before rendering
  const settings = await db.settings.get(1);
  applyTheme(settings?.theme ?? 'system');

  const auth = await authService.checkAuth().catch(() => authService.state);

  // Re-derive cycles from observations on every boot so any stale cycle
  // records left over from older code are healed automatically.
  await cycleService.evaluateCycles().catch(() => {});

  initAppShell();

  // Flag a silent sign-out (signed in before, but the session is now gone).
  updateAuthBanner();

  // First-visit disclaimer popup
  if (!localStorage.getItem('disclaimerDismissed')) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-content" style="padding:28px 22px calc(28px + env(safe-area-inset-bottom, 0px))">
        <h2 style="font-family:var(--font-display);font-size:1.2rem;font-weight:700;margin-bottom:14px">Welcome to Chart35</h2>
        <p style="font-size:0.9rem;line-height:1.6;color:var(--text-secondary);margin-bottom:14px">
          This app is a personal charting tool and is not a substitute for instruction from a certified FertilityCare Practitioner.
          The Creighton Model FertilityCare\u2122 System should be learned through proper instruction.
          To find an instructor in your area, visit <a href="https://www.fertilitycare.org/find-a-center/" target="_blank" rel="noopener" style="color:var(--accent)">FertilityCare.org</a>.
        </p>
        <p style="font-size:0.9rem;line-height:1.6;color:var(--text-secondary);margin-bottom:14px">
          All data is stored locally on your device. If you sign in, your data is end-to-end encrypted before being backed up to our server for cross-device access \u2014 no one else can read it, not even us.
        </p>
        <p style="font-size:0.78rem;line-height:1.5;color:var(--text-muted);margin-bottom:20px">
          This app is an independent project and is not affiliated with, endorsed by, or sponsored by FertilityCare Centers of America, Creighton University, or the Saint Paul VI Institute.
          Creighton Model FertilityCare\u2122 System is a trademark of FertilityCare Centers of America.
        </p>
        <button class="btn btn-primary btn-block" id="dismiss-disclaimer">I Understand</button>
      </div>
    `;
    document.body.appendChild(overlay);
    document.getElementById('dismiss-disclaimer')!.addEventListener('click', () => {
      localStorage.setItem('disclaimerDismissed', '1');
      overlay.remove();
      initCookieConsent();
    });
  } else {
    // Cookie consent (loads GA only if accepted)
    initCookieConsent();
  }

  // Sync from server on load if logged in — but never silently overwrite local
  // data. safeAutoSync only pulls when nothing local would be lost; if this
  // device has entries the server lacks, it surfaces the conflict instead.
  if (auth.loggedIn) {
    syncService.safeAutoSync()
      .then(({ action }) => {
        if (action === 'downloaded') {
          window.dispatchEvent(new HashChangeEvent('hashchange'));
        } else if (action === 'conflict') {
          showToast('This device has chart entries not saved to your account — open Settings → Account to review', 'error');
        }
      })
      .catch(() => showToast('Could not sync from server', 'error'));
  }

  // Auto-sync pending data when connectivity returns
  window.addEventListener('online', () => {
    if (authService.state.loggedIn) {
      syncService.flushPending();
    }
  });
}

main();
