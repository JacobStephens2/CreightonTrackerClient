import { setConsent } from '../utils/cookie-consent';

export function renderCookiePolicyView(container: HTMLElement): void {
  container.innerHTML = '';

  const wrapper = document.createElement('div');

  const card = document.createElement('div');
  card.className = 'card';
  card.innerHTML = `
    <h2 style="font-size:1.25rem;margin-bottom:4px">Cookie Policy</h2>
    <p style="font-size:0.75rem;color:var(--text-secondary);margin-bottom:16px">Effective date: March 29, 2026</p>

    <div class="section-label" style="margin-top:0">What Are Cookies?</div>
    <p style="font-size:0.875rem;margin-bottom:16px">
      Cookies are small text files stored on your device by your browser. They are commonly used to remember preferences, track usage, and support website functionality.
    </p>

    <div class="section-label">Cookies We Use</div>

    <div style="margin-bottom:12px">
      <strong style="font-size:0.875rem">Essential (Functional)</strong>
      <p style="font-size:0.875rem;margin-top:4px;margin-bottom:4px">
        These are required for core functionality and are not optional.
      </p>
      <ul style="font-size:0.875rem;margin:0 0 0 20px">
        <li><strong>Authentication cookie</strong> — A JWT token stored as an HTTP-only cookie when you sign in. Used to keep you logged in across page loads. Expires after 30 days or when you sign out.</li>
      </ul>
    </div>

    <div style="margin-bottom:16px">
      <strong style="font-size:0.875rem">Analytics (Optional)</strong>
      <p style="font-size:0.875rem;margin-top:4px;margin-bottom:4px">
        These are only set if you accept analytics cookies via the consent banner.
      </p>
      <ul style="font-size:0.875rem;margin:0 0 0 20px">
        <li><strong>_ga</strong> — Google Analytics identifier used to distinguish users. Expires after 2 years.</li>
        <li><strong>_ga_*</strong> — Google Analytics session identifier. Expires after 2 years.</li>
        <li><strong>_gid</strong> — Google Analytics identifier used to distinguish users. Expires after 24 hours.</li>
      </ul>
    </div>

    <div class="section-label">Local Storage</div>
    <p style="font-size:0.875rem;margin-bottom:16px">
      The App also uses your browser's local storage (not cookies) for app preferences such as theme selection, disclaimer dismissal, and cookie consent choice. Local storage data is never sent to any server.
    </p>

    <div class="section-label">How to Manage Cookies</div>
    <p style="font-size:0.875rem;margin-bottom:8px">
      You can change your analytics cookie preference at any time using the buttons below. You can also clear cookies through your browser settings.
    </p>
    <div style="display:flex;gap:10px;margin-bottom:16px">
      <button class="btn btn-primary" style="flex:1" id="cookie-policy-accept">Accept Analytics</button>
      <button class="btn btn-secondary" style="flex:1" id="cookie-policy-decline">Decline Analytics</button>
    </div>

    <div class="section-label">No Health Data in Cookies</div>
    <p style="font-size:0.875rem;margin-bottom:16px">
      No health data, observations, or personal cycle information is ever stored in cookies or sent to analytics services. All health data remains on your device or, if you choose to sync, is end-to-end encrypted before being sent to our server.
    </p>

    <div class="section-label">Contact</div>
    <p style="font-size:0.875rem;margin-bottom:0">
      If you have questions about this cookie policy, contact Jacob Stephens at
      <a href="mailto:jacob@stephens.page" style="color:var(--accent)">jacob@stephens.page</a>.
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

  // Wire up accept/decline buttons
  document.getElementById('cookie-policy-accept')!.addEventListener('click', () => {
    setConsent('accepted');
    alert('Analytics cookies accepted.');
  });

  document.getElementById('cookie-policy-decline')!.addEventListener('click', () => {
    setConsent('declined');
    alert('Analytics cookies declined and removed.');
  });
}
