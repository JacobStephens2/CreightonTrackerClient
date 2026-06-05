import { renderStamp } from './stamp';
import { addDays, displayDate, daysBetween, dayOfWeek } from '../utils/date-utils';
import {
  BLEEDING_LABELS,
  MUCUS_STRETCH_LABELS,
  MUCUS_CHAR_LABELS,
  FREQUENCY_LABELS,
  buildObservationCode,
} from '../utils/creighton-codes';
import type { Observation, Cycle } from '../db/models';

const MIN_CHART_COLUMNS = 35;

type ChartZoom = 'normal' | 'compact' | 'trend';
const ZOOM_KEY = 'chartZoom';

function getSavedZoom(): ChartZoom {
  const v = localStorage.getItem(ZOOM_KEY);
  return v === 'compact' || v === 'trend' ? v : 'normal';
}

function saveZoom(z: ChartZoom): void {
  if (z === 'normal') localStorage.removeItem(ZOOM_KEY);
  else localStorage.setItem(ZOOM_KEY, z);
}

interface SharedData {
  firstName?: string;
  observations: Observation[];
  cycles: Cycle[];
  updatedAt: string;
}

export function renderSharedChartView(container: HTMLElement, data: SharedData): void {
  container.innerHTML = '';

  // Header
  const header = document.createElement('header');
  header.className = 'header';
  const h1 = document.createElement('h1');
  h1.textContent = data.firstName ? `${data.firstName}'s Chart` : 'Shared Chart';
  header.appendChild(h1);
  container.appendChild(header);

  const content = document.createElement('main');
  content.className = 'content';
  content.style.paddingBottom = '24px';

  // Last updated
  const updated = document.createElement('p');
  updated.style.cssText = 'text-align:center;font-size:0.8125rem;color:var(--text-secondary);margin:8px 0';
  updated.textContent = `Last updated: ${new Date(data.updatedAt).toLocaleString()}`;
  content.appendChild(updated);

  const cycles = data.cycles;
  const observations = data.observations;

  if (cycles.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.innerHTML = '<h2>No Data</h2><p>No chart data has been synced yet.</p>';
    content.appendChild(empty);
    container.appendChild(content);
    return;
  }

  // Legend
  const legend = document.createElement('div');
  legend.className = 'chart-legend';
  const legendItems = [
    { color: 'green', label: 'Dry / Infertile' },
    { color: 'red', label: 'Bleeding' },
    { color: 'white', label: 'Fertile (Mucus)' },
    { color: 'yellow', label: 'Infertile pattern' },
    { color: 'chick', label: 'Fertile day' },
    { color: 'intercourse', label: 'Intercourse' },
  ];
  for (const item of legendItems) {
    const li = document.createElement('div');
    li.className = 'legend-item';
    if (item.color === 'chick') {
      li.innerHTML = `<span class="legend-dot legend-dot-chick">🐣</span>${item.label}`;
    } else if (item.color === 'intercourse') {
      li.innerHTML = `<span class="legend-dot legend-dot-intercourse"></span>${item.label}`;
    } else {
      li.innerHTML = `<span class="legend-dot legend-dot-${item.color}"></span>${item.label}`;
    }
    if (item.color === 'yellow') {
      li.style.cursor = 'pointer';
      li.addEventListener('click', () => {
        const existing = legend.querySelector('.bip-popup');
        if (existing) {
          existing.remove();
          return;
        }
        const popup = document.createElement('div');
        popup.className = 'bip-popup card';
        popup.style.cssText = 'margin-top:8px;padding:12px;font-size:0.8125rem;line-height:1.5';
        popup.innerHTML = `
          <strong>Infertile pattern (yellow stamp)</strong>
          <p style="margin:6px 0">
            A yellow stamp marks a day on which the chart-owner answered the
            <em>Essential Sameness Question</em> &mdash; &ldquo;Is today essentially the
            same as yesterday?&rdquo; &mdash; with <strong>yes</strong>, identifying the day
            as part of her <strong>established, unchanging baseline</strong> (Base Infertile
            Pattern / BIP). A <strong>no</strong> answer is a Point of Change and is charted
            with white stamps instead.
          </p>
          <p style="margin:6px 0 0">
            Yellow stamps assume the BIP was established with a certified FertilityCare
            Practitioner across at least two cycles. The chart-owner is the one applying
            them in-app; the toggle in her observation form is gated only by her own
            judgment.
          </p>
        `;
        popup.addEventListener('click', () => popup.remove());
        legend.appendChild(popup);
      });
    }
    legend.appendChild(li);
  }
  content.appendChild(legend);

  // Zoom toolbar (Normal / Compact / Trend) — same UX as the real chart
  const currentZoom = getSavedZoom();
  const toolbar = document.createElement('div');
  toolbar.className = 'chart-toolbar';
  const zoomGroup = document.createElement('div');
  zoomGroup.className = 'chart-zoom';
  zoomGroup.setAttribute('role', 'radiogroup');
  zoomGroup.setAttribute('aria-label', 'Chart zoom');
  const zoomLevels: { value: ChartZoom; label: string; aria: string }[] = [
    { value: 'normal',  label: 'Normal',  aria: 'Normal zoom' },
    { value: 'compact', label: 'Compact', aria: 'Compact zoom — smaller stamps' },
    { value: 'trend',   label: 'Trend',   aria: 'Trend view — dense overview' },
  ];
  for (const lvl of zoomLevels) {
    const btn = document.createElement('button');
    btn.className = `chart-zoom-btn${lvl.value === currentZoom ? ' active' : ''}`;
    btn.textContent = lvl.label;
    btn.setAttribute('role', 'radio');
    btn.setAttribute('aria-label', lvl.aria);
    btn.setAttribute('aria-checked', lvl.value === currentZoom ? 'true' : 'false');
    btn.addEventListener('click', () => {
      saveZoom(lvl.value);
      renderSharedChartView(container, data);
    });
    zoomGroup.appendChild(btn);
  }
  toolbar.appendChild(zoomGroup);
  content.appendChild(toolbar);

  // Build observation lookup by date
  const obsByDate = new Map<string, Observation>();
  for (const obs of observations) {
    obsByDate.set(obs.date, obs);
  }

  // Track the latest observation date per cycle so ongoing cycles can be
  // sized correctly (no live "today" knowledge here — we use the snapshot).
  const lastObsByCycle = new Map<number, string>();
  for (const obs of observations) {
    if (obs.cycleId === undefined) continue;
    const existing = lastObsByCycle.get(obs.cycleId);
    if (!existing || obs.date > existing) lastObsByCycle.set(obs.cycleId, obs.date);
  }

  // Grow the chart wide enough to fit the longest cycle in the snapshot.
  const longestCycle = cycles.reduce((max, c) => {
    let len: number;
    if (c.endDate) {
      len = daysBetween(c.startDate, c.endDate);
    } else {
      const lastObs = c.id !== undefined ? lastObsByCycle.get(c.id) : undefined;
      len = lastObs ? daysBetween(c.startDate, lastObs) + 1 : 1;
    }
    return Math.max(max, len);
  }, 0);
  const CHART_COLUMNS = Math.max(MIN_CHART_COLUMNS, longestCycle);

  // Chart table
  const wrapper = document.createElement('div');
  wrapper.className = 'chart-container';
  if (currentZoom !== 'normal') wrapper.setAttribute('data-zoom', currentZoom);

  const table = document.createElement('table');
  table.className = 'chart-table';

  // Header row
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  headerRow.className = 'chart-header';
  const thCycle = document.createElement('th');
  thCycle.textContent = 'Cycle';
  headerRow.appendChild(thCycle);
  for (let i = 1; i <= CHART_COLUMNS; i++) {
    const th = document.createElement('th');
    th.textContent = String(i);
    headerRow.appendChild(th);
  }
  thead.appendChild(headerRow);
  table.appendChild(thead);

  // Cycle rows (newest first)
  const tbody = document.createElement('tbody');
  const sortedCycles = [...cycles].sort((a, b) => b.startDate.localeCompare(a.startDate));

  for (let i = 0; i < sortedCycles.length; i++) {
    const cycle = sortedCycles[i];
    const cycleNumber = cycles.length - i;
    const row = document.createElement('tr');
    row.className = 'cycle-row';

    // Cycle label
    const tdLabel = document.createElement('td');
    const labelDiv = document.createElement('div');
    labelDiv.className = 'cycle-label';
    const numSpan = document.createElement('span');
    numSpan.className = 'cycle-label-num';
    numSpan.textContent = `#${cycleNumber}`;
    const dateSpan = document.createElement('span');
    dateSpan.className = 'cycle-label-date';
    dateSpan.textContent = displayDate(cycle.startDate);
    labelDiv.appendChild(numSpan);
    labelDiv.appendChild(dateSpan);
    if (cycle.length) {
      const lenSpan = document.createElement('span');
      lenSpan.className = 'cycle-label-len';
      lenSpan.textContent = `${cycle.length}d`;
      labelDiv.appendChild(lenSpan);
    }
    tdLabel.appendChild(labelDiv);
    row.appendChild(tdLabel);

    // Get observations for this cycle
    const cycleObs = observations.filter(o => o.cycleId === cycle.id);
    const obsByDay = new Map<number, Observation>();
    for (const obs of cycleObs) {
      const dayNum = daysBetween(cycle.startDate, obs.date) + 1;
      obsByDay.set(dayNum, obs);
    }

    const totalDays = cycle.endDate
      ? daysBetween(cycle.startDate, cycle.endDate)
      : cycleObs.length > 0
        ? daysBetween(cycle.startDate, cycleObs[cycleObs.length - 1].date) + 1
        : 1;

    for (let dayNum = 1; dayNum <= CHART_COLUMNS; dayNum++) {
      const td = document.createElement('td');

      if (dayNum > totalDays && cycle.endDate) {
        td.className = 'chart-empty';
      } else {
        const obs = obsByDay.get(dayNum);
        const dateStr = addDays(cycle.startDate, dayNum - 1);

        if (obs) {
          const stampEl = renderStamp(obs, {
            showDate: dateStr,
            showCode: true,
            onClick: () => showSharedObservationDetail(obs),
          });
          stampEl.setAttribute('role', 'button');
          stampEl.setAttribute('tabindex', '0');
          stampEl.setAttribute('aria-haspopup', 'dialog');
          stampEl.title = 'View observation details';
          stampEl.addEventListener('keydown', (e: KeyboardEvent) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              showSharedObservationDetail(obs);
            }
          });
          td.appendChild(stampEl);
        } else if (dayNum <= totalDays) {
          const emptyStamp = document.createElement('div');
          emptyStamp.className = 'stamp';
          const dayLabel = document.createElement('span');
          dayLabel.className = 'stamp-day';
          dayLabel.textContent = displayDate(dateStr);
          emptyStamp.appendChild(dayLabel);
          const circle = document.createElement('div');
          circle.className = 'stamp-circle';
          circle.style.border = '2px dashed var(--border-color)';
          circle.style.background = 'transparent';
          emptyStamp.appendChild(circle);
          td.appendChild(emptyStamp);
        }

        // Highlight every manually flagged peak (supports double peaks)
        const peakObs = obsByDay.get(dayNum);
        if (peakObs?.isPeakDay) {
          td.classList.add('chart-peak-col');
        }
      }

      row.appendChild(td);
    }

    tbody.appendChild(row);
  }

  table.appendChild(tbody);
  wrapper.appendChild(table);
  content.appendChild(wrapper);

  // Disclaimer
  const disclaimer = document.createElement('div');
  disclaimer.className = 'disclaimer';
  disclaimer.innerHTML =
    'This is a shared read-only view of a Creighton Model chart. ' +
    'This app is a personal charting tool and is not a substitute for instruction from a certified FertilityCare Practitioner.<br><br>' +
    '<span style="font-size:0.72rem">This app is not affiliated with, endorsed by, or sponsored by FertilityCare Centers of America, Creighton University, or the Saint Paul VI Institute. ' +
    'Creighton Model FertilityCare\u2122 System is a trademark of FertilityCare Centers of America.</span>';
  content.appendChild(disclaimer);

  // Link to main site
  const link = document.createElement('p');
  link.style.cssText = 'text-align:center;margin-top:16px';
  link.innerHTML = '<a href="https://chart35.com/" style="color:var(--primary);font-size:0.875rem">Start tracking with Chart35</a>';
  content.appendChild(link);

  container.appendChild(content);
}

/**
 * Read-only observation detail modal for the shared view. Mirrors the look of
 * the editable observation form (same modal shell, header, and stamp preview)
 * but renders the recorded values as static text — no inputs, no saving.
 */
function showSharedObservationDetail(obs: Observation): void {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Observation details');

  const modal = document.createElement('div');
  modal.className = 'modal-content';

  const close = () => {
    overlay.remove();
    document.removeEventListener('keydown', onKey);
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') close();
  };

  // Header
  const header = document.createElement('div');
  header.className = 'obs-form-header';
  const titleGroup = document.createElement('div');
  titleGroup.className = 'obs-form-title-group';
  const title = document.createElement('h2');
  title.textContent = 'Observation';
  titleGroup.appendChild(title);
  const closeBtn = document.createElement('button');
  closeBtn.className = 'obs-form-close';
  closeBtn.innerHTML = '&times;';
  closeBtn.setAttribute('aria-label', 'Close');
  closeBtn.addEventListener('click', close);
  header.appendChild(titleGroup);
  header.appendChild(closeBtn);
  modal.appendChild(header);

  // Date
  const dateEl = document.createElement('div');
  dateEl.className = 'obs-form-date';
  dateEl.textContent = `${dayOfWeek(obs.date)}, ${displayDate(obs.date)} ${obs.date.slice(0, 4)}`;
  modal.appendChild(dateEl);

  // Stamp preview + code (same component as the form's preview)
  const preview = document.createElement('div');
  preview.className = 'obs-preview';
  const [, mPart, dPart] = obs.date.split('-');
  const dateBadge = document.createElement('span');
  dateBadge.className = 'obs-preview-date';
  dateBadge.textContent = `${parseInt(mPart, 10)}/${parseInt(dPart, 10)}`;
  preview.appendChild(dateBadge);
  preview.appendChild(renderStamp(obs, { large: true, showCode: false }));
  const codeEl = document.createElement('span');
  codeEl.className = 'obs-preview-code';
  codeEl.textContent = buildObservationCode(
    obs.bleeding,
    obs.mucusStretch,
    obs.mucusCharacteristics,
    obs.frequency,
    obs.brown,
  );
  preview.appendChild(codeEl);
  modal.appendChild(preview);

  // Recorded details — only rows that have a value
  const details = document.createElement('dl');
  details.className = 'obs-detail-list';
  const addRow = (label: string, value: string) => {
    const dt = document.createElement('dt');
    dt.textContent = label;
    const dd = document.createElement('dd');
    dd.textContent = value;
    details.appendChild(dt);
    details.appendChild(dd);
  };

  // Bleeding obscures mucus (H/M); mirror the form's display by only showing
  // mucus rows when the day isn't a heavy/moderate flow day.
  const mucusObscured = obs.bleeding === 'H' || obs.bleeding === 'M';
  if (obs.bleeding) {
    addRow('Bleeding', BLEEDING_LABELS[obs.bleeding] + (obs.brown ? ' (brown)' : ''));
  } else if (obs.brown) {
    addRow('Bleeding', 'Brown spotting');
  }
  if (!mucusObscured && obs.mucusStretch) {
    addRow('Mucus', MUCUS_STRETCH_LABELS[obs.mucusStretch]);
  }
  if (!mucusObscured && obs.mucusCharacteristics && obs.mucusCharacteristics.length > 0) {
    addRow('Characteristics', obs.mucusCharacteristics.map(c => MUCUS_CHAR_LABELS[c]).join(', '));
  }
  if (!mucusObscured && obs.frequency) {
    addRow('Frequency', FREQUENCY_LABELS[obs.frequency]);
  }
  if (obs.isPeakDay) addRow('Peak day', 'Yes');
  if (obs.intercourse) addRow('Intercourse', 'Yes');
  if (obs.notes && obs.notes.trim()) addRow('Notes', obs.notes.trim());

  if (details.childElementCount === 0) {
    const none = document.createElement('p');
    none.style.cssText = 'text-align:center;color:var(--text-secondary);font-size:0.875rem;margin:12px 0 4px';
    none.textContent = 'No additional details recorded for this day.';
    modal.appendChild(none);
  } else {
    modal.appendChild(details);
  }

  // Read-only notice
  const note = document.createElement('p');
  note.style.cssText = 'text-align:center;color:var(--text-secondary);font-size:0.75rem;margin:16px 0 0';
  note.textContent = 'Read-only — shared chart';
  modal.appendChild(note);

  overlay.appendChild(modal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });
  document.addEventListener('keydown', onKey);
  document.body.appendChild(overlay);
}
