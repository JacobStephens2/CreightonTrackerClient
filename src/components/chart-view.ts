import { cycleService } from '../services/cycle-service';
import { observationService } from '../services/observation-service';
import { renderStamp } from './stamp';
import { showObservationForm } from './observation-form';
import { displayDate, addDays, daysBetween, today } from '../utils/date-utils';
import { generateSampleData } from '../utils/sample-data';
import type { Observation, Cycle } from '../db/models';

// In-memory sample dataset, generated once and mutated by demo edits so they
// persist across re-renders within the session without ever touching the DB.
let sampleData: { cycles: Cycle[]; observationsByCycle: Map<number, Observation[]> } | null = null;
function getSampleData() {
  if (!sampleData) sampleData = generateSampleData();
  return sampleData;
}

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

export async function renderChartView(container: HTMLElement): Promise<void> {
  container.innerHTML = '';

  // "Show sample chart" toggle (Settings → Default View) forces the example
  // chart regardless of real data, so the user can demo the app without
  // exposing their own observations.
  if (localStorage.getItem('forceSampleChart') === 'true') {
    renderSampleChart(container);
    return;
  }

  const cycles = await cycleService.getAll();

  // Grow the chart wide enough to fit the longest cycle. For ongoing cycles,
  // count up to today so the user can see (and fill in) days past 35.
  const longestCycle = cycles.reduce((max, c) => {
    const len = c.endDate
      ? daysBetween(c.startDate, c.endDate)
      : daysBetween(c.startDate, today()) + 1;
    return Math.max(max, len);
  }, 0);
  const CHART_COLUMNS = Math.max(MIN_CHART_COLUMNS, longestCycle);

  if (cycles.length === 0) {
    if (localStorage.getItem('sampleDismissed')) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.innerHTML = '<h2>No Observations Yet</h2><p>Tap the + button to record your first observation.</p>';
      container.appendChild(empty);
    } else {
      renderSampleChart(container);
    }
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
  ];
  for (const item of legendItems) {
    const li = document.createElement('div');
    li.className = 'legend-item';
    li.innerHTML = `<span class="legend-dot legend-dot-${item.color}"></span>${item.label}`;
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
            Some women &mdash; especially postpartum, breastfeeding, with PCOS, or in long
            cycles &mdash; see some discharge almost every day. A yellow stamp marks a day
            that matches that <strong>established, unchanging baseline</strong> &mdash; what
            Creighton calls the Base Infertile Pattern (BIP).
          </p>
          <p style="margin:6px 0">
            Each day, ask the <em>Essential Sameness Question</em>:
            <strong>&ldquo;Is today essentially the same as yesterday?&rdquo;</strong>
          </p>
          <ul style="margin:6px 0;padding-left:18px">
            <li><strong>Yes</strong> &rarr; it's part of your baseline &rarr; yellow stamp (infertile).</li>
            <li><strong>No</strong> &rarr; the pattern changed (more wet, clear, stretchy, or
              lubricative). That's a <strong>Point of Change</strong>: fertility is presumed to
              begin and you switch to white stamps until the Peak Day.</li>
          </ul>
          <p style="margin:6px 0 0">
            <strong>Important:</strong> your baseline must be established with a certified
            FertilityCare Practitioner across at least two cycles before you start using
            yellow stamps. Applying yellow stamps before the baseline is confirmed has
            been linked to method-use pregnancies.
          </p>
        `;
        popup.addEventListener('click', () => popup.remove());
        legend.appendChild(popup);
      });
    }
    legend.appendChild(li);
  }
  container.appendChild(legend);

  // Zoom toolbar
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
  const currentZoom = getSavedZoom();
  for (const lvl of zoomLevels) {
    const btn = document.createElement('button');
    btn.className = `chart-zoom-btn${lvl.value === currentZoom ? ' active' : ''}`;
    btn.textContent = lvl.label;
    btn.setAttribute('role', 'radio');
    btn.setAttribute('aria-label', lvl.aria);
    btn.setAttribute('aria-checked', lvl.value === currentZoom ? 'true' : 'false');
    btn.addEventListener('click', () => {
      saveZoom(lvl.value);
      renderChartView(container);
    });
    zoomGroup.appendChild(btn);
  }
  toolbar.appendChild(zoomGroup);
  container.appendChild(toolbar);

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
  const sortedCycles = [...cycles].reverse();

  let mostRecentCell: HTMLTableCellElement | null = null;

  for (let i = 0; i < sortedCycles.length; i++) {
    const cycle = sortedCycles[i];
    const cycleNumber = cycles.length - i;
    const row = document.createElement('tr');
    row.className = 'cycle-row';

    // Cycle label cell
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
    const observations = await observationService.getByCycle(cycle.id!);
    const obsByDay = new Map<number, Observation>();
    for (const obs of observations) {
      const dayNum = daysBetween(cycle.startDate, obs.date) + 1;
      obsByDay.set(dayNum, obs);
    }

    // Determine how many days to show
    const totalDays = cycle.endDate
      ? daysBetween(cycle.startDate, cycle.endDate)
      : observations.length > 0
        ? daysBetween(cycle.startDate, observations[observations.length - 1].date) + 1
        : 1;

    // For active cycles, extend clickable range up to today so users can
    // fill in missed days between their last observation and now.
    const lastClickableDay = cycle.endDate
      ? totalDays
      : Math.max(totalDays, daysBetween(cycle.startDate, today()) + 1);

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
            onClick: () => {
              showObservationForm(dateStr, obs, () => renderChartView(container));
            },
          });
          td.appendChild(stampEl);
          if (i === 0) {
            mostRecentCell = td;
          }
        } else if (dayNum <= lastClickableDay) {
          // Empty day within cycle - clickable to add
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
          emptyStamp.style.cursor = 'pointer';
          emptyStamp.addEventListener('click', () => {
            showObservationForm(dateStr, undefined, () => renderChartView(container));
          });
          td.appendChild(emptyStamp);
        }

        // Peak day column highlight — highlight every manually flagged peak
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
  container.appendChild(wrapper);

  if (mostRecentCell) {
    const cell = mostRecentCell;
    requestAnimationFrame(() => {
      const target = cell.offsetLeft + cell.offsetWidth - wrapper.clientWidth + 20;
      wrapper.scrollLeft = Math.max(0, target);
    });
  }
}

function renderSampleChart(container: HTMLElement): void {
  // Banner
  const banner = document.createElement('div');
  banner.className = 'sample-banner';
  banner.innerHTML = `
    <strong>Sample Chart</strong>
    <p>This is an example of what your chart will look like. Tap the + button to record your first observation and start tracking.</p>
  `;

  const forced = localStorage.getItem('forceSampleChart') === 'true';
  const dismissBtn = document.createElement('button');
  dismissBtn.className = 'btn btn-secondary';
  dismissBtn.style.cssText = 'margin-top:8px;font-size:0.8125rem;padding:8px 16px;min-height:36px';
  dismissBtn.textContent = forced ? 'Show my chart' : 'Dismiss Sample';
  dismissBtn.addEventListener('click', () => {
    if (forced) {
      // Sample was shown via the Settings toggle — turn it off and return
      // to the user's real chart, leaving their data untouched.
      localStorage.removeItem('forceSampleChart');
      renderChartView(container);
      return;
    }
    localStorage.setItem('sampleDismissed', 'true');
    container.innerHTML = '';
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.innerHTML = '<h2>No Observations Yet</h2><p>Tap the + button to record your first observation.</p>';
    container.appendChild(empty);
  });
  banner.appendChild(dismissBtn);

  container.appendChild(banner);

  // Full legend — same set the real chart uses, including chick + intercourse
  // so the sample teaches every visual element a user will encounter.
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
    legend.appendChild(li);
  }
  container.appendChild(legend);

  // Zoom toolbar (Normal / Compact / Trend) — same UX as the real chart
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
  const currentZoom = getSavedZoom();
  for (const lvl of zoomLevels) {
    const btn = document.createElement('button');
    btn.className = `chart-zoom-btn${lvl.value === currentZoom ? ' active' : ''}`;
    btn.textContent = lvl.label;
    btn.setAttribute('role', 'radio');
    btn.setAttribute('aria-label', lvl.aria);
    btn.setAttribute('aria-checked', lvl.value === currentZoom ? 'true' : 'false');
    btn.addEventListener('click', () => {
      saveZoom(lvl.value);
      container.innerHTML = '';
      renderSampleChart(container);
    });
    zoomGroup.appendChild(btn);
  }
  toolbar.appendChild(zoomGroup);
  container.appendChild(toolbar);

  const { cycles, observationsByCycle } = getSampleData();

  // Flat list of all sample observations + a helper to apply a demo edit to
  // the in-memory sample set (never the DB).
  const allSampleObs = () => [...observationsByCycle.values()].flat();
  function applySampleEdit(updated: Observation) {
    for (const [cid, list] of observationsByCycle) {
      const idx = list.findIndex(o => o.date === updated.date);
      if (idx >= 0) {
        list[idx] = { ...updated, cycleId: cid };
        return;
      }
    }
  }
  function removeSampleObs(date: string) {
    for (const list of observationsByCycle.values()) {
      const idx = list.findIndex(o => o.date === date);
      if (idx >= 0) { list.splice(idx, 1); return; }
    }
  }

  // Grow the chart wide enough to fit the longest cycle in the sample data.
  const longestCycle = cycles.reduce((max, c) => Math.max(max, c.length ?? 0), 0);
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
  const sortedCycles = [...cycles].reverse();

  let mostRecentCell: HTMLTableCellElement | null = null;

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
    const observations = observationsByCycle.get(cycle.id!) ?? [];
    const obsByDay = new Map<number, Observation>();
    for (const obs of observations) {
      const dayNum = daysBetween(cycle.startDate, obs.date) + 1;
      obsByDay.set(dayNum, obs);
    }

    const totalDays = cycle.length ?? observations.length;

    for (let dayNum = 1; dayNum <= CHART_COLUMNS; dayNum++) {
      const td = document.createElement('td');

      if (dayNum > totalDays && cycle.endDate) {
        td.className = 'chart-empty';
      } else {
        const obs = obsByDay.get(dayNum);

        if (obs) {
          const dateStr = addDays(cycle.startDate, dayNum - 1);
          const stampEl = renderStamp(obs, {
            showDate: dateStr,
            showCode: true,
            onClick: () => {
              // Open the form in sample mode — edits update the in-memory
              // sample set and never touch the user's real data.
              showObservationForm(dateStr, obs, () => renderChartView(container), {
                observations: allSampleObs(),
                onSave: (updated) => applySampleEdit(updated),
                onDelete: (date) => removeSampleObs(date),
              });
            },
          });
          td.appendChild(stampEl);
          if (i === 0) {
            mostRecentCell = td;
          }
        }

        // Peak day column highlight — supports multiple peaks
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
  container.appendChild(wrapper);

  if (mostRecentCell) {
    const cell = mostRecentCell;
    requestAnimationFrame(() => {
      const target = cell.offsetLeft + cell.offsetWidth - wrapper.clientWidth + 20;
      wrapper.scrollLeft = Math.max(0, target);
    });
  }
}
