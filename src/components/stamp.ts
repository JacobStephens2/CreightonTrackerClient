import type { Observation, StampType } from '../db/models';
import { getStampLabel, isBabyStamp } from '../utils/stamp-logic';
import { buildObservationCode } from '../utils/creighton-codes';
import { displayDate } from '../utils/date-utils';

/** Get the CSS class for a stamp's color group */
function getStampClass(stamp: StampType): string {
  if (stamp === 'red') return 'stamp-red';
  if (stamp === 'green') return 'stamp-green';
  if (stamp === 'yellow') return 'stamp-yellow';
  if (stamp.startsWith('yellowBaby')) return `stamp-${stamp}`;
  if (stamp.startsWith('greenBaby')) return `stamp-${stamp}`;
  if (stamp.startsWith('whiteBaby')) return `stamp-${stamp}`;
  if (stamp.startsWith('white')) return 'stamp-white';
  return 'stamp-green';
}

/** Render a stamp element */
export function renderStamp(
  obs?: Observation,
  options?: { large?: boolean; showCode?: boolean; showDate?: string; onClick?: () => void }
): HTMLElement {
  const el = document.createElement('div');
  const stamp = obs?.stamp ?? 'green';
  const label = getStampLabel(stamp);
  const hasBaby = isBabyStamp(stamp);

  el.className = `stamp ${getStampClass(stamp)} ${options?.large ? 'stamp-lg' : ''} ${
    obs?.intercourse ? 'has-intercourse' : ''
  }`.trim();
  el.setAttribute('role', 'img');
  el.setAttribute('aria-label', `${label} stamp${hasBaby ? ', fertile' : ''}${obs?.intercourse ? ', intercourse recorded' : ''}`);

  if (options?.showDate !== undefined) {
    const dayEl = document.createElement('span');
    dayEl.className = 'stamp-day';
    dayEl.textContent = displayDate(options.showDate);
    el.appendChild(dayEl);
  }

  const circle = document.createElement('div');
  circle.className = 'stamp-circle';
  circle.textContent = label;

  // Intercourse indicator
  const icDot = document.createElement('span');
  icDot.className = 'stamp-intercourse';
  circle.appendChild(icDot);

  el.appendChild(circle);

  // Observation code
  if (options?.showCode !== false && obs) {
    const codeEl = document.createElement('span');
    codeEl.className = 'stamp-code';
    codeEl.textContent = buildObservationCode(
      obs.bleeding,
      obs.mucusStretch,
      obs.mucusCharacteristics,
      obs.frequency,
      obs.brown
    );
    el.appendChild(codeEl);
  }

  if (options?.onClick) {
    el.style.cursor = 'pointer';
    el.addEventListener('click', options.onClick);
  }

  return el;
}

/** Render a mini stamp for calendar cells */
export function renderMiniStamp(stamp?: StampType): HTMLElement {
  const el = document.createElement('div');
  if (!stamp) return el;

  const label = getStampLabel(stamp);

  let colorClass = 'calendar-stamp-green';
  if (stamp === 'red') colorClass = 'calendar-stamp-red';
  else if (stamp.startsWith('white')) colorClass = 'calendar-stamp-white';
  else if (stamp.startsWith('yellow')) colorClass = 'calendar-stamp-yellow';

  el.className = `calendar-stamp ${colorClass}`;
  el.textContent = label;
  return el;
}
