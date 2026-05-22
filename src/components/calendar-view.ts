import { observationService } from '../services/observation-service';
import { cycleService } from '../services/cycle-service';
import { renderMiniStamp } from './stamp';
import { showObservationForm } from './observation-form';
import { today, getDatesInMonth, firstDayOfMonth, displayMonth } from '../utils/date-utils';
import { generateSampleData } from '../utils/sample-data';
import type { Observation, Cycle } from '../db/models';

let currentYear: number | undefined;
let currentMonth: number | undefined;

export async function renderCalendarView(container: HTMLElement): Promise<void> {
  if (!currentYear || currentMonth === undefined) {
    const initialMonth = await getInitialMonth();
    currentYear = initialMonth.year;
    currentMonth = initialMonth.month;
  }

  await renderMonth(container);
}

async function renderMonth(container: HTMLElement): Promise<void> {
  if (currentYear === undefined || currentMonth === undefined) {
    const initialMonth = await getInitialMonth();
    currentYear = initialMonth.year;
    currentMonth = initialMonth.month;
  }

  const year = currentYear;
  const month = currentMonth;

  container.innerHTML = '';

  // Navigation
  const nav = document.createElement('div');
  nav.className = 'calendar-nav';

  const prevBtn = document.createElement('button');
  prevBtn.className = 'calendar-nav-btn';
  prevBtn.innerHTML = '&#8249;';
  prevBtn.addEventListener('click', async () => {
    currentMonth = month - 1;
    if (currentMonth < 0) {
      currentMonth = 11;
      currentYear = year - 1;
    } else {
      currentYear = year;
    }
    await renderMonth(container);
  });

  const title = document.createElement('h2');
  title.textContent = displayMonth(year, month);

  const nextBtn = document.createElement('button');
  nextBtn.className = 'calendar-nav-btn';
  nextBtn.innerHTML = '&#8250;';
  nextBtn.addEventListener('click', async () => {
    currentMonth = month + 1;
    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear = year + 1;
    } else {
      currentYear = year;
    }
    await renderMonth(container);
  });

  nav.appendChild(prevBtn);
  nav.appendChild(title);
  nav.appendChild(nextBtn);
  container.appendChild(nav);

  // Calendar grid
  const grid = document.createElement('div');
  grid.className = 'calendar-grid';

  // Weekday headers
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  for (const wd of weekdays) {
    const wdEl = document.createElement('div');
    wdEl.className = 'calendar-weekday';
    wdEl.textContent = wd;
    grid.appendChild(wdEl);
  }

  // Get dates and observations
  const dates = getDatesInMonth(year, month);
  const startPad = firstDayOfMonth(year, month);
  const todayStr = today();

  // Fetch observations and cycles for this month
  const firstDate = dates[0];
  const lastDate = dates[dates.length - 1];
  const { observations, cycles, isSampleMode } = await getCalendarData(firstDate, lastDate);
  const obsByDate = new Map<string, Observation>();
  for (const obs of observations) {
    obsByDate.set(obs.date, obs);
  }

  // Get cycle start dates for boundary indicators
  const cycleStartDates = new Set(cycles.map(c => c.startDate));

  // Empty padding cells
  for (let i = 0; i < startPad; i++) {
    const emptyCell = document.createElement('div');
    emptyCell.className = 'calendar-day empty';
    grid.appendChild(emptyCell);
  }

  // Day cells
  for (const dateStr of dates) {
    const dayNum = parseInt(dateStr.slice(8), 10);
    const obs = obsByDate.get(dateStr);

    const cell = document.createElement('button');
    cell.className = 'calendar-day';
    if (dateStr === todayStr) cell.classList.add('today');
    if (obs) cell.classList.add('has-obs');
    if (cycleStartDates.has(dateStr)) cell.classList.add('cycle-start');

    const numEl = document.createElement('span');
    numEl.className = 'calendar-day-num';
    numEl.textContent = String(dayNum);
    cell.appendChild(numEl);

    if (obs?.stamp) {
      cell.appendChild(renderMiniStamp(obs.stamp));
    }

    cell.addEventListener('click', () => {
      showObservationForm(dateStr, obs, () => renderMonth(container));
    });

    grid.appendChild(cell);
  }

  container.appendChild(grid);

  // Today button
  const todayBtn = document.createElement('button');
  todayBtn.className = 'btn btn-secondary btn-block';
  todayBtn.textContent = isSampleMode ? 'Go to Sample Month' : 'Go to Today';
  todayBtn.style.marginTop = '16px';
  todayBtn.addEventListener('click', async () => {
    const targetMonth = isSampleMode
      ? getSampleAnchorMonth()
      : { year: new Date().getFullYear(), month: new Date().getMonth() };
    currentYear = targetMonth.year;
    currentMonth = targetMonth.month;
    await renderMonth(container);
  });
  container.appendChild(todayBtn);
}

/** Reset calendar to current month (called on navigation) */
export function resetCalendar(): void {
  currentYear = undefined;
  currentMonth = undefined;
}

async function getInitialMonth(): Promise<{ year: number; month: number }> {
  const cycles = await cycleService.getAll();
  if (cycles.length > 0) {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  }

  if (!localStorage.getItem('sampleDismissed')) {
    return getSampleAnchorMonth();
  }

  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() };
}

async function getCalendarData(
  firstDate: string,
  lastDate: string
): Promise<{ observations: Observation[]; cycles: Cycle[]; isSampleMode: boolean }> {
  const cycles = await cycleService.getAll();
  if (cycles.length > 0) {
    return {
      observations: await observationService.getRange(firstDate, lastDate),
      cycles,
      isSampleMode: false,
    };
  }

  if (localStorage.getItem('sampleDismissed')) {
    return {
      observations: [],
      cycles: [],
      isSampleMode: false,
    };
  }

  const sample = generateSampleData();
  const observations = Array.from(sample.observationsByCycle.values())
    .flat()
    .filter((obs) => obs.date >= firstDate && obs.date <= lastDate);

  return {
    observations,
    cycles: sample.cycles,
    isSampleMode: true,
  };
}

function getSampleAnchorMonth(): { year: number; month: number } {
  const sample = generateSampleData();
  const latestCycle = sample.cycles[sample.cycles.length - 1];
  const [year, month] = latestCycle.startDate.split('-').map(Number);
  return { year, month: month - 1 };
}
