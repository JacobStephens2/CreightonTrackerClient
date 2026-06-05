import { authService, wasPreviouslyLoggedIn, getLastAccount, wasSessionInvalidated } from '../services/auth-service';
import { exportService } from '../services/export-service';
import { showToast } from '../utils/toast';
import { router } from '../router';

const BANNER_ID = 'auth-reminder-banner';
// Dismissals last only for the current session, so the reminder returns on the
// next launch until the user actually signs back in.
const DISMISS_KEY = 'authReminderDismissed';

/**
 * Show or hide the app-wide "you're signed out" reminder banner. Visible only
 * when the user has signed in on this device before but the session is now
 * gone (a silent expiry) and they haven't dismissed it this session. Safe to
 * call repeatedly — it reconciles the DOM to the current state.
 */
export function updateAuthBanner(): void {
  const existing = document.getElementById(BANNER_ID);

  const show =
    wasPreviouslyLoggedIn() &&
    !authService.state.loggedIn &&
    wasSessionInvalidated() &&
    sessionStorage.getItem(DISMISS_KEY) !== '1';

  if (!show) {
    existing?.remove();
    return;
  }
  if (existing) return;

  const { email } = getLastAccount();

  const banner = document.createElement('div');
  banner.id = BANNER_ID;
  banner.className = 'auth-banner';
  banner.setAttribute('role', 'status');

  const text = document.createElement('span');
  text.className = 'auth-banner-text';
  text.append('You’re signed out. ');
  if (email) {
    text.append('Changes to ');
    const strong = document.createElement('strong');
    strong.textContent = email;
    text.append(strong, ' aren’t being backed up or synced.');
  } else {
    text.append('Your changes aren’t being backed up or synced.');
  }
  banner.appendChild(text);

  // Let the user save a local backup before re-syncing, so nothing is lost.
  const backupBtn = document.createElement('button');
  backupBtn.type = 'button';
  backupBtn.className = 'auth-banner-secondary';
  backupBtn.textContent = 'Back up';
  backupBtn.title = 'Save a backup file of this device’s data';
  backupBtn.addEventListener('click', async () => {
    backupBtn.disabled = true;
    try {
      const done = await exportService.downloadBackup();
      if (done) showToast('Backup saved — keep it somewhere safe', 'success');
    } catch {
      showToast('Could not create a backup', 'error');
    } finally {
      backupBtn.disabled = false;
    }
  });
  banner.appendChild(backupBtn);

  const signInBtn = document.createElement('button');
  signInBtn.type = 'button';
  signInBtn.className = 'auth-banner-action';
  signInBtn.textContent = 'Sign in';
  signInBtn.addEventListener('click', () => router.navigate('/settings'));
  banner.appendChild(signInBtn);

  const dismissBtn = document.createElement('button');
  dismissBtn.type = 'button';
  dismissBtn.className = 'auth-banner-dismiss';
  dismissBtn.setAttribute('aria-label', 'Dismiss');
  dismissBtn.innerHTML = '&times;';
  dismissBtn.addEventListener('click', () => {
    sessionStorage.setItem(DISMISS_KEY, '1');
    banner.remove();
  });
  banner.appendChild(dismissBtn);

  const header = document.querySelector('.header');
  if (header) header.insertAdjacentElement('afterend', banner);
  else document.getElementById('app')?.prepend(banner);
}
