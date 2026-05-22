import { observationService } from '../services/observation-service';
import { renderStamp } from './stamp';
import { showObservationForm } from './observation-form';
import { displayDate, dayOfWeek, addDays } from '../utils/date-utils';
import { buildObservationCode, BLEEDING_LABELS, MUCUS_STRETCH_LABELS, MUCUS_CHAR_LABELS, FREQUENCY_LABELS } from '../utils/creighton-codes';
import { router } from '../router';
import type { BleedingCode, MucusStretchCode, MucusCharacteristic, FrequencyCode } from '../db/models';

export async function renderDayDetail(container: HTMLElement, date: string): Promise<void> {
  container.innerHTML = '';

  const obs = await observationService.getByDate(date);

  const detail = document.createElement('div');
  detail.className = 'day-detail';

  // Header with nav
  const header = document.createElement('div');
  header.className = 'day-detail-header';
  const headerTitle = document.createElement('h2');
  headerTitle.textContent = `${dayOfWeek(date)}, ${displayDate(date)}`;
  header.appendChild(headerTitle);

  const navDiv = document.createElement('div');
  navDiv.className = 'day-detail-nav';
  const prevBtn = document.createElement('button');
  prevBtn.innerHTML = '&#8249;';
  prevBtn.setAttribute('aria-label', 'Previous day');
  prevBtn.addEventListener('click', () => router.navigate(`/day/${addDays(date, -1)}`));
  const nextBtn = document.createElement('button');
  nextBtn.innerHTML = '&#8250;';
  nextBtn.setAttribute('aria-label', 'Next day');
  nextBtn.addEventListener('click', () => router.navigate(`/day/${addDays(date, 1)}`));
  navDiv.appendChild(prevBtn);
  navDiv.appendChild(nextBtn);
  header.appendChild(navDiv);
  detail.appendChild(header);

  if (!obs) {
    // No observation for this day
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.innerHTML = '<h2>No Observation</h2><p>No data recorded for this day.</p>';
    detail.appendChild(empty);

    const addBtn = document.createElement('button');
    addBtn.className = 'btn btn-primary btn-block';
    addBtn.textContent = 'Add Observation';
    addBtn.style.marginTop = '16px';
    addBtn.addEventListener('click', () => {
      showObservationForm(date, undefined, () => renderDayDetail(container, date));
    });
    detail.appendChild(addBtn);
  } else {
    // Stamp display
    const stampWrap = document.createElement('div');
    stampWrap.className = 'day-detail-stamp';
    stampWrap.appendChild(renderStamp(obs, { large: true }));
    detail.appendChild(stampWrap);

    // Info rows
    const info = document.createElement('div');
    info.className = 'day-detail-info';

    addRow(info, 'Code', buildObservationCode(obs.bleeding, obs.mucusStretch, obs.mucusCharacteristics, obs.frequency, obs.brown));
    addRow(info, 'Stamp', obs.stamp ?? '—');

    if (obs.bleeding) {
      addRow(info, 'Bleeding', `${obs.bleeding} — ${BLEEDING_LABELS[obs.bleeding as BleedingCode] ?? obs.bleeding}`);
    }
    if (obs.brown) {
      addRow(info, 'Brown', 'Yes');
    }
    if (obs.mucusStretch) {
      addRow(info, 'Mucus', `${obs.mucusStretch} — ${MUCUS_STRETCH_LABELS[obs.mucusStretch as MucusStretchCode] ?? obs.mucusStretch}`);
    }
    if (obs.mucusCharacteristics && obs.mucusCharacteristics.length > 0) {
      const charLabels = obs.mucusCharacteristics.map(
        (c: MucusCharacteristic) => `${c} (${MUCUS_CHAR_LABELS[c] ?? c})`
      );
      addRow(info, 'Characteristics', charLabels.join(', '));
    }
    if (obs.frequency) {
      addRow(info, 'Frequency', `${obs.frequency} — ${FREQUENCY_LABELS[obs.frequency as FrequencyCode] ?? obs.frequency}`);
    }
    if (obs.isPeakDay) {
      addRow(info, 'Peak Day', 'Yes');
    }
    if (obs.intercourse) {
      addRow(info, 'Intercourse', 'Yes');
    }
    if (obs.notes) {
      addRow(info, 'Notes', obs.notes);
    }

    detail.appendChild(info);

    // Actions
    const actions = document.createElement('div');
    actions.className = 'day-detail-actions';

    const editBtn = document.createElement('button');
    editBtn.className = 'btn btn-primary';
    editBtn.textContent = 'Edit';
    editBtn.addEventListener('click', () => {
      showObservationForm(date, obs, () => renderDayDetail(container, date));
    });
    actions.appendChild(editBtn);

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn btn-danger';
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', async () => {
      await observationService.delete(date);
      renderDayDetail(container, date);
    });
    actions.appendChild(deleteBtn);

    detail.appendChild(actions);
  }

  container.appendChild(detail);
}

function addRow(parent: HTMLElement, label: string, value: string): void {
  const row = document.createElement('div');
  row.className = 'day-detail-row';
  const labelEl = document.createElement('span');
  labelEl.className = 'day-detail-row-label';
  labelEl.textContent = label;
  const valueEl = document.createElement('span');
  valueEl.className = 'day-detail-row-value';
  valueEl.textContent = value;
  row.appendChild(labelEl);
  row.appendChild(valueEl);
  parent.appendChild(row);
}
