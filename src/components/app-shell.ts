import { router } from '../router';
import { renderChartView } from './chart-view';
import { renderCalendarView, resetCalendar } from './calendar-view';
import { renderDayDetail } from './day-detail';
import { renderSettingsView } from './settings-view';
import { renderResetPasswordView } from './reset-password-view';
import { renderVerifyEmailView } from './verify-email-view';
import { renderPrivacyPolicyView } from './privacy-policy-view';
import { renderTermsOfUseView } from './terms-of-use-view';
import { renderCookiePolicyView } from './cookie-policy-view';
import { renderSystemGuideView } from './system-guide-view';
import { showObservationForm } from './observation-form';
import { today } from '../utils/date-utils';

// SVG icons
const ICON_LOGO = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2c3.13 0 5.87 1.7 7.35 4.23.32.55.13 1.25-.42 1.56-.55.32-1.25.13-1.56-.42A6.25 6.25 0 0012 4.3 6.3 6.3 0 006.24 8.1 6.27 6.27 0 006.7 15c1.14 1.95 3.19 3.18 5.45 3.18 1.95 0 3.8-.93 4.98-2.48.38-.5 1.1-.6 1.61-.21.5.38.6 1.1.21 1.61A8.5 8.5 0 0112.15 20.5c-3.08 0-5.95-1.64-7.5-4.3A8.57 8.57 0 014.02 8.3 8.59 8.59 0 0112 2zm0 4.2c.63 0 1.15.51 1.15 1.15v3.98l2.72 1.63a1.15 1.15 0 11-1.18 1.98l-3.28-1.97a1.15 1.15 0 01-.56-.99V7.35c0-.64.51-1.15 1.15-1.15z"/></svg>`;
const ICON_CHART = `<svg viewBox="0 0 24 24"><path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/></svg>`;
const ICON_CALENDAR = `<svg viewBox="0 0 24 24"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"/></svg>`;
const ICON_SETTINGS = `<svg viewBox="0 0 24 24"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.49.49 0 00-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 00-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6A3.6 3.6 0 1115.6 12 3.6 3.6 0 0112 15.6z"/></svg>`;
const ICON_CHART_BTN = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h4v4H4V4zm6 0h4v4h-4V4zm6 0h4v4h-4V4zM4 10h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4zM4 16h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4z"/></svg>`;
const ICON_PLUS = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5a1 1 0 112 0v6h6a1 1 0 110 2h-6v6a1 1 0 11-2 0v-6H5a1 1 0 110-2h6V5z"/></svg>`;

type ActiveView = 'chart' | 'calendar' | 'day' | 'settings';
type ContentLayout = 'default' | 'chart';

export function initAppShell(): void {
  const app = document.getElementById('app')!;
  app.innerHTML = '';

  // Header
  const header = document.createElement('header');
  header.className = 'header';
  header.innerHTML = `
    <button type="button" class="header-brand" aria-label="Go to chart">
      <div class="header-mark">${ICON_LOGO}</div>
      <div class="header-copy">
        <h1>Creighton Tracker</h1>
      </div>
    </button>
  `;
  header.querySelector<HTMLButtonElement>('.header-brand')!
    .addEventListener('click', () => router.navigate('/chart'));
  const headerAction = document.createElement('button');
  headerAction.className = 'header-action';
  headerAction.type = 'button';
  headerAction.setAttribute('aria-label', 'Open chart');
  headerAction.innerHTML = ICON_CHART_BTN;
  headerAction.addEventListener('click', () => router.navigate('/chart'));
  header.appendChild(headerAction);
  app.appendChild(header);

  // Content
  const content = document.createElement('main');
  content.className = 'content';
  content.id = 'main-content';
  app.appendChild(content);

  // FAB
  const fab = document.createElement('button');
  fab.className = 'fab';
  fab.type = 'button';
  fab.innerHTML = ICON_PLUS;
  fab.setAttribute('aria-label', 'Add observation for today');
  fab.addEventListener('click', () => {
    showObservationForm(today(), undefined, () => {
      // Re-render current view
      const hash = window.location.hash.slice(1) || '/';
      if (hash === '/' || hash === '/chart') renderChartView(content);
      else if (hash === '/calendar') renderCalendarView(content);
    });
  });
  app.appendChild(fab);

  // Bottom nav
  const nav = document.createElement('nav');
  nav.className = 'bottom-nav';

  const navItems: { icon: string; label: string; route: string; view: ActiveView }[] = [
    { icon: ICON_CHART, label: 'Chart', route: '/', view: 'chart' },
    { icon: ICON_CALENDAR, label: 'Calendar', route: '/calendar', view: 'calendar' },
    { icon: ICON_SETTINGS, label: 'Settings', route: '/settings', view: 'settings' },
  ];

  nav.setAttribute('aria-label', 'Main navigation');

  for (const item of navItems) {
    const btn = document.createElement('button');
    btn.className = 'nav-item';
    btn.innerHTML = `${item.icon}<span>${item.label}</span>`;
    btn.setAttribute('aria-label', item.label);
    btn.addEventListener('click', () => router.navigate(item.route));
    btn.dataset.view = item.view;
    nav.appendChild(btn);
  }
  app.appendChild(nav);

  // Set up routes
  router.on('/', () => {
    setActiveNav('chart');
    setContentLayout(content, 'chart');
    renderChartView(content);
  });

  router.on('/chart', () => {
    setActiveNav('chart');
    setContentLayout(content, 'chart');
    renderChartView(content);
  });

  router.on('/calendar', () => {
    setActiveNav('calendar');
    setContentLayout(content, 'default');
    resetCalendar();
    renderCalendarView(content);
  });

  router.on('/day/:date', (params) => {
    setActiveNav('day');
    setContentLayout(content, 'default');
    renderDayDetail(content, params.date);
  });

  router.on('/settings', () => {
    setActiveNav('settings');
    setContentLayout(content, 'default');
    renderSettingsView(content);
  });

  router.on('/reset-password/:token', (params) => {
    setActiveNav('settings');
    setContentLayout(content, 'default');
    renderResetPasswordView(content, params.token);
  });

  router.on('/verify-email/:token', (params) => {
    setActiveNav('settings');
    setContentLayout(content, 'default');
    renderVerifyEmailView(content, params.token);
  });

  router.on('/privacy', () => {
    setActiveNav('settings');
    setContentLayout(content, 'default');
    renderPrivacyPolicyView(content);
  });

  router.on('/terms', () => {
    setActiveNav('settings');
    setContentLayout(content, 'default');
    renderTermsOfUseView(content);
  });

  router.on('/cookies', () => {
    setActiveNav('settings');
    setContentLayout(content, 'default');
    renderCookiePolicyView(content);
  });

  router.on('/guide', () => {
    setActiveNav('settings');
    setContentLayout(content, 'default');
    renderSystemGuideView(content);
  });

  router.start();
}

function setActiveNav(view: ActiveView): void {
  document.querySelectorAll('.nav-item').forEach((el) => {
    const btn = el as HTMLElement;
    const isActive = btn.dataset.view === view;
    btn.classList.toggle('active', isActive);
    if (isActive) {
      btn.setAttribute('aria-current', 'page');
    } else {
      btn.removeAttribute('aria-current');
    }
  });
}

function setContentLayout(content: HTMLElement, layout: ContentLayout): void {
  content.classList.toggle('content--chart', layout === 'chart');
}
