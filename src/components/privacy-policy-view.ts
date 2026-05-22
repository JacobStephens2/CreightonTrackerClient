export function renderPrivacyPolicyView(container: HTMLElement): void {
  container.innerHTML = '';

  const wrapper = document.createElement('div');

  const card = document.createElement('div');
  card.className = 'card';
  card.innerHTML = `
    <h2 style="font-size:1.25rem;margin-bottom:4px">Privacy Policy</h2>
    <p style="font-size:0.75rem;color:var(--text-secondary);margin-bottom:16px">Effective date: March 21, 2026</p>

    <div class="section-label" style="margin-top:0">Overview</div>
    <p style="font-size:0.875rem;margin-bottom:16px">
      Creighton Cycle Tracker ("the App") is built by Jacob Stephens. This policy explains what data the App collects, how it is stored, and how it is used. Your privacy is important — the App is designed to keep your health data under your control.
    </p>

    <div class="section-label">Data Stored on Your Device</div>
    <p style="font-size:0.875rem;margin-bottom:8px">
      All fertility observations, cycle data, and settings are stored locally on your device using your browser's IndexedDB storage. This data never leaves your device unless you explicitly choose to sync or share it.
    </p>
    <p style="font-size:0.875rem;margin-bottom:16px">
      You can export or delete your local data at any time from the Settings page.
    </p>

    <div class="section-label">Account & Sync (Optional)</div>
    <p style="font-size:0.875rem;margin-bottom:8px">
      If you create an account, the following information is stored on our server:
    </p>
    <ul style="font-size:0.875rem;margin:0 0 8px 20px">
      <li>Your first name and email address</li>
      <li>A hashed version of your password (never stored in plain text)</li>
      <li>Your observation and cycle data, end-to-end encrypted before leaving your device</li>
    </ul>
    <p style="font-size:0.875rem;margin-bottom:8px">
      Sync is entirely optional. The App is fully functional without an account.
    </p>
    <p style="font-size:0.875rem;margin-bottom:16px">
      Your health data is encrypted on your device using a key derived from your password (PBKDF2 with 600,000 iterations) before being sent to the server. This means even the server operator cannot read your synced observations or cycle data. Only someone with your password can decrypt it.
    </p>

    <div class="section-label">Provider Sharing (Optional)</div>
    <p style="font-size:0.875rem;margin-bottom:16px">
      If you generate a provider share link, a read-only view of your synced chart data is made accessible at that link. The shared view excludes private fields such as intercourse records and personal notes. Share links expire after 90 days and can be revoked at any time from Settings, which immediately disables access. Share links use cryptographically random 256-bit tokens.
    </p>

    <div class="section-label">Analytics & Cookies</div>
    <p style="font-size:0.875rem;margin-bottom:16px">
      The App uses Google Analytics to collect anonymous usage data such as page views and general device information. Analytics cookies are only set if you accept them via the consent banner shown on your first visit. No health data or personal observations are sent to Google Analytics. You can change your preference at any time from our <a href="#/cookies" style="color:var(--accent)">Cookie Policy</a> page.
    </p>

    <div class="section-label">Third-Party Sharing</div>
    <p style="font-size:0.875rem;margin-bottom:16px">
      Your data is never sold to third parties. Health data is only shared when you explicitly enable provider sharing. No advertising networks or data brokers receive your information.
    </p>

    <div class="section-label">Data Security</div>
    <p style="font-size:0.875rem;margin-bottom:16px">
      All communication with our server uses HTTPS encryption. Synced data is end-to-end encrypted: your device encrypts data with a key derived from your password (AES-256-GCM) before sending it to the server, and the server applies an additional encryption layer at rest. Passwords are hashed using bcrypt. Authentication tokens are invalidated when your password is reset. While no system is perfectly secure, we take reasonable measures to protect your data.
    </p>

    <div class="section-label">Data Deletion</div>
    <p style="font-size:0.875rem;margin-bottom:8px">
      You can delete all local data from the Settings page at any time. If you have an account and would like your server data deleted, contact us at the email below.
    </p>
    <p style="font-size:0.875rem;margin-bottom:16px">
      Uninstalling the App or clearing your browser data will also remove all locally stored data.
    </p>

    <div class="section-label">Children's Privacy</div>
    <p style="font-size:0.875rem;margin-bottom:16px">
      The App is not directed at children under the age of 13. We do not knowingly collect personal information from children.
    </p>

    <div class="section-label">Changes to This Policy</div>
    <p style="font-size:0.875rem;margin-bottom:16px">
      If this policy is updated, the revised version will be posted on this page with an updated effective date.
    </p>

    <div class="section-label">Contact</div>
    <p style="font-size:0.875rem;margin-bottom:16px">
      If you have questions about this privacy policy or your data, contact Jacob Stephens at
      <a href="mailto:jacob@stephens.page" style="color:var(--accent)">jacob@stephens.page</a>.
    </p>

    <div class="section-label">Trademark Notice</div>
    <p style="font-size:0.875rem;margin-bottom:0">
      This app is an independent project and is not affiliated with, endorsed by, or sponsored by FertilityCare Centers of America, Creighton University, or the Saint Paul VI Institute. Creighton Model FertilityCare\u2122 System is a trademark of FertilityCare Centers of America. Used here for descriptive purposes only.
    </p>
  `;

  wrapper.appendChild(card);

  const backBtn = document.createElement('button');
  backBtn.className = 'btn btn-secondary btn-block';
  backBtn.textContent = 'Back to Settings';
  backBtn.style.marginTop = '4px';
  backBtn.addEventListener('click', () => {
    window.location.hash = '/settings';
  });
  wrapper.appendChild(backBtn);

  container.appendChild(wrapper);
}
