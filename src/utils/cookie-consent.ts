const GA_ID = 'G-4RXK6BKTKW';
const CONSENT_KEY = 'cookieConsent';

type ConsentValue = 'accepted' | 'declined';

function getConsent(): ConsentValue | null {
  return localStorage.getItem(CONSENT_KEY) as ConsentValue | null;
}

function loadGA(): void {
  if (document.getElementById('ga-script')) return;
  const script = document.createElement('script');
  script.id = 'ga-script';
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  function gtag(...args: unknown[]): void {
    window.dataLayer!.push(args);
  }
  gtag('js', new Date());
  gtag('config', GA_ID);
}

function removeGA(): void {
  // Remove GA cookies
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const name = cookie.split('=')[0].trim();
    if (name.startsWith('_ga') || name.startsWith('_gid')) {
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    }
  }
}

export function setConsent(value: ConsentValue): void {
  localStorage.setItem(CONSENT_KEY, value);
  if (value === 'accepted') {
    loadGA();
  } else {
    removeGA();
  }
}

export function initCookieConsent(): void {
  const consent = getConsent();

  // If already accepted, load GA immediately
  if (consent === 'accepted') {
    loadGA();
    return;
  }

  // If already declined, do nothing
  if (consent === 'declined') return;

  // Show consent banner
  const banner = document.createElement('div');
  banner.className = 'cookie-banner';
  banner.innerHTML = `
    <p>This site uses cookies for anonymous analytics (Google Analytics) to help improve the app. No health data is shared. See our <a href="#/cookies" style="color:var(--accent)">Cookie Policy</a> for details.</p>
    <div class="cookie-banner-actions">
      <button class="btn btn-secondary" id="cookie-decline">Decline</button>
      <button class="btn btn-primary" id="cookie-accept">Accept</button>
    </div>
  `;
  document.body.appendChild(banner);

  document.getElementById('cookie-accept')!.addEventListener('click', () => {
    setConsent('accepted');
    banner.remove();
  });

  document.getElementById('cookie-decline')!.addEventListener('click', () => {
    setConsent('declined');
    banner.remove();
  });
}

// Extend Window for GA
declare global {
  interface Window {
    dataLayer?: unknown[][];
  }
}
