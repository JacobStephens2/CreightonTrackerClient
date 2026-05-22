import type { Observation, BleedingCode, MucusStretchCode, MucusCharacteristic, FrequencyCode } from '../db/models';
import { BLEEDING_LABELS, MUCUS_STRETCH_LABELS, MUCUS_CHAR_LABELS, FREQUENCY_LABELS, buildObservationCode } from '../utils/creighton-codes';
import { displayDate, dayOfWeek } from '../utils/date-utils';
import { determineStamp } from '../utils/stamp-logic';
import { renderStamp } from './stamp';
import { observationService } from '../services/observation-service';
import { cycleService } from '../services/cycle-service';

interface FormState {
  date: string;
  bleeding?: BleedingCode;
  brown: boolean;
  mucusStretch?: MucusStretchCode;
  mucusCharacteristics: MucusCharacteristic[];
  frequency?: FrequencyCode;
  isPeakDay: boolean;
  isCycleStart: boolean;
  isBIP: boolean;
  intercourse: boolean;
  notes: string;
}

export function showObservationForm(
  date: string,
  existing?: Observation,
  onSave?: () => void
): void {
  let current: Observation | undefined = existing;
  const state: FormState = {
    date,
    bleeding: existing?.bleeding,
    brown: existing?.brown ?? false,
    mucusStretch: existing?.mucusStretch,
    mucusCharacteristics: existing?.mucusCharacteristics ? [...existing.mucusCharacteristics] : [],
    frequency: existing?.frequency,
    isPeakDay: existing?.isPeakDay ?? false,
    isCycleStart: existing?.isCycleStart ?? false,
    isBIP: existing?.stampOverride === 'yellow' || existing?.stampOverride === 'yellowBaby',
    intercourse: existing?.intercourse ?? false,
    notes: existing?.notes ?? '',
  };

  let stampContext: { peakDay?: string; postPeakCount?: number; inFertileWindow?: boolean; pastPostPeakWindow?: boolean } = {};
  let neighbors: { prev?: string; next?: string } = {};

  // Create modal overlay
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', existing ? 'Edit Observation' : 'New Observation');

  const modal = document.createElement('div');
  modal.className = 'modal-content';

  function render() {
    modal.innerHTML = '';

    // Header
    const header = document.createElement('div');
    header.className = 'obs-form-header';

    const titleGroup = document.createElement('div');
    titleGroup.className = 'obs-form-title-group';

    if (current) {
      const prevBtn = document.createElement('button');
      prevBtn.className = 'obs-form-nav';
      prevBtn.innerHTML = '&larr;';
      prevBtn.setAttribute('aria-label', 'Previous observation');
      prevBtn.disabled = !neighbors.prev;
      if (neighbors.prev) {
        prevBtn.addEventListener('click', () => loadObservation(neighbors.prev!));
      }
      titleGroup.appendChild(prevBtn);
    }

    const title = document.createElement('h2');
    title.textContent = current ? 'Edit Observation' : 'New Observation';
    titleGroup.appendChild(title);

    if (current) {
      const nextBtn = document.createElement('button');
      nextBtn.className = 'obs-form-nav';
      nextBtn.innerHTML = '&rarr;';
      nextBtn.setAttribute('aria-label', 'Next observation');
      nextBtn.disabled = !neighbors.next;
      if (neighbors.next) {
        nextBtn.addEventListener('click', () => loadObservation(neighbors.next!));
      }
      titleGroup.appendChild(nextBtn);
    }

    const closeBtn = document.createElement('button');
    closeBtn.className = 'obs-form-close';
    closeBtn.innerHTML = '&times;';
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.addEventListener('click', () => overlay.remove());
    header.appendChild(titleGroup);
    header.appendChild(closeBtn);
    modal.appendChild(header);

    // Date
    const dateEl = document.createElement('div');
    dateEl.className = 'obs-form-date';
    if (current) {
      dateEl.textContent = `${dayOfWeek(state.date)}, ${displayDate(state.date)} ${state.date.slice(0, 4)}`;
    } else {
      const dateLbl = document.createElement('label');
      dateLbl.textContent = 'Date';
      dateLbl.style.cssText = 'font-size:0.8125rem;font-weight:600;color:var(--text-secondary);margin-right:8px';
      const dateInput = document.createElement('input');
      dateInput.type = 'date';
      dateInput.value = state.date;
      dateInput.style.cssText = 'font-size:1rem;padding:4px 8px';
      dateInput.setAttribute('aria-label', 'Observation date');
      dateLbl.appendChild(dateInput);
      dateInput.addEventListener('change', () => {
        state.date = dateInput.value;
        refreshStampContext();
      });
      dateEl.appendChild(dateLbl);
    }
    modal.appendChild(dateEl);

    // Preview
    const preview = document.createElement('div');
    preview.className = 'obs-preview';
    const [, mPart, dPart] = state.date.split('-');
    const shortDate = `${parseInt(mPart, 10)}/${parseInt(dPart, 10)}`;
    const dateBadge = document.createElement('span');
    dateBadge.className = 'obs-preview-date';
    dateBadge.textContent = shortDate;
    preview.appendChild(dateBadge);
    const previewObs: Observation = {
      date: state.date,
      bleeding: state.bleeding,
      brown: state.brown || undefined,
      mucusStretch: state.mucusStretch,
      mucusCharacteristics: state.mucusCharacteristics.length > 0 ? state.mucusCharacteristics : undefined,
      frequency: state.frequency,
      isPeakDay: state.isPeakDay,
      intercourse: state.intercourse,
      stampOverride: state.isBIP ? 'yellow' : undefined,
      stamp: determineStamp({
        date: state.date,
        bleeding: state.bleeding,
        brown: state.brown || undefined,
        mucusStretch: state.mucusStretch,
        mucusCharacteristics: state.mucusCharacteristics.length > 0 ? state.mucusCharacteristics : undefined,
        isPeakDay: state.isPeakDay,
        stampOverride: state.isBIP ? 'yellow' : undefined,
      }, stampContext),
    };
    preview.appendChild(renderStamp(previewObs, { large: true, showCode: false }));
    const codeEl = document.createElement('span');
    codeEl.className = 'obs-preview-code';
    codeEl.textContent = buildObservationCode(
      state.bleeding,
      state.mucusStretch,
      state.mucusCharacteristics.length > 0 ? state.mucusCharacteristics : undefined,
      state.frequency,
      state.brown
    );
    preview.appendChild(codeEl);
    modal.appendChild(preview);

    const form = document.createElement('div');
    form.className = 'obs-form';

    // Bleeding section
    form.appendChild(sectionLabel('Bleeding'));
    form.appendChild(
      toggleGroup(
        Object.entries(BLEEDING_LABELS).map(([code, label]) => ({
          value: code,
          label: `${code} - ${label}`,
          active: state.bleeding === code,
          colorHint: 'red',
        })),
        (val) => {
          state.bleeding = state.bleeding === val ? undefined : (val as BleedingCode);
          render();
        },
        true
      )
    );

    // Brown toggle
    const brownSection = document.createElement('div');
    brownSection.className = 'intercourse-toggle';
    brownSection.appendChild(createSwitch(state.brown, (v) => {
      state.brown = v;
      render();
    }));
    const brownLabel = document.createElement('label');
    brownLabel.textContent = 'Brown';
    brownSection.appendChild(brownLabel);
    form.appendChild(brownSection);

    // Vulvar observation (non-mucus: 0, 2, 2W, 4)
    form.appendChild(sectionLabel('Vulvar Observation (Non-Mucus)'));
    const nonMucusCodes: MucusStretchCode[] = ['0', '2', '2W', '4'];
    form.appendChild(
      toggleGroup(
        nonMucusCodes.map((code) => ({
          value: code,
          label: `${code} - ${MUCUS_STRETCH_LABELS[code]}`,
          active: state.mucusStretch === code,
          colorHint: 'green',
        })),
        (val) => {
          state.mucusStretch = state.mucusStretch === val ? undefined : (val as MucusStretchCode);
          render();
        },
        true
      )
    );

    // Mucus observation (6, 8, 10, 10DL, 10SL, 10WL)
    form.appendChild(sectionLabel('Cervical Mucus'));
    const mucusCodes: MucusStretchCode[] = ['6', '8', '10', '10DL', '10SL', '10WL'];
    form.appendChild(
      toggleGroup(
        mucusCodes.map((code) => ({
          value: code,
          label: `${code} - ${MUCUS_STRETCH_LABELS[code]}`,
          active: state.mucusStretch === code,
          colorHint: 'white',
        })),
        (val) => {
          state.mucusStretch = state.mucusStretch === val ? undefined : (val as MucusStretchCode);
          render();
        },
        true
      )
    );

    // Mucus characteristics (only if actual mucus: 6, 8, 10, 10DL, 10SL, 10WL)
    const actualMucusCodes = new Set(['6', '8', '10', '10DL', '10SL', '10WL']);
    if (state.mucusStretch && actualMucusCodes.has(state.mucusStretch)) {
      form.appendChild(sectionLabel('Mucus Characteristics'));
      form.appendChild(
        toggleGroup(
          Object.entries(MUCUS_CHAR_LABELS).map(([code, label]) => ({
            value: code,
            label: `${code} - ${label}`,
            active: state.mucusCharacteristics.includes(code as MucusCharacteristic),
          })),
          (val) => {
            const char = val as MucusCharacteristic;
            const idx = state.mucusCharacteristics.indexOf(char);
            if (idx >= 0) {
              state.mucusCharacteristics.splice(idx, 1);
            } else {
              state.mucusCharacteristics.push(char);
            }
            render();
          },
          false // multi-select
        )
      );
    }

    // Frequency
    form.appendChild(sectionLabel('Frequency'));
    form.appendChild(
      toggleGroup(
        Object.entries(FREQUENCY_LABELS).map(([code, label]) => ({
          value: code,
          label,
          active: state.frequency === code,
        })),
        (val) => {
          state.frequency = state.frequency === val ? undefined : (val as FrequencyCode);
          render();
        },
        true
      )
    );

    // Peak day toggle
    const peakSection = document.createElement('div');
    peakSection.className = 'peak-toggle';
    const peakLabel = document.createElement('div');
    peakLabel.className = 'peak-toggle-label';
    peakLabel.innerHTML = '<span>Peak Day</span><span>Mark as the last day of peak-type mucus</span>';
    peakSection.appendChild(peakLabel);
    peakSection.appendChild(createSwitch(state.isPeakDay, (v) => {
      state.isPeakDay = v;
      render();
    }));
    form.appendChild(peakSection);

    // Cycle start toggle
    const cycleStartSection = document.createElement('div');
    cycleStartSection.className = 'peak-toggle';
    const cycleStartLabel = document.createElement('div');
    cycleStartLabel.className = 'peak-toggle-label';
    cycleStartLabel.innerHTML = '<span>First Day of Cycle</span><span>Force this observation to start a new cycle</span>';
    cycleStartSection.appendChild(cycleStartLabel);
    cycleStartSection.appendChild(createSwitch(state.isCycleStart, (v) => {
      state.isCycleStart = v;
      render();
    }));
    form.appendChild(cycleStartSection);

    // Infertile pattern / Base Infertile Pattern toggle (yellow stamp)
    const bipSection = document.createElement('div');
    bipSection.className = 'peak-toggle';
    const bipLabel = document.createElement('div');
    bipLabel.className = 'peak-toggle-label';
    bipLabel.innerHTML = '<span>Infertile pattern</span><span>Mark with a yellow stamp</span>';
    bipSection.appendChild(bipLabel);
    bipSection.appendChild(createSwitch(state.isBIP, (v) => {
      state.isBIP = v;
      render();
    }));
    form.appendChild(bipSection);

    // Intercourse toggle
    const icSection = document.createElement('div');
    icSection.className = 'intercourse-toggle';
    icSection.appendChild(createSwitch(state.intercourse, (v) => {
      state.intercourse = v;
      render();
    }));
    const icLabel = document.createElement('label');
    icLabel.textContent = 'Intercourse';
    icSection.appendChild(icLabel);
    form.appendChild(icSection);

    // Notes
    form.appendChild(sectionLabel('Notes'));
    const notesEl = document.createElement('textarea');
    notesEl.placeholder = 'Optional notes...';
    notesEl.value = state.notes;
    notesEl.addEventListener('input', (e) => {
      state.notes = (e.target as HTMLTextAreaElement).value;
    });
    form.appendChild(notesEl);

    // Actions
    const actions = document.createElement('div');
    actions.className = 'obs-form-actions';

    if (current) {
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'btn btn-danger';
      deleteBtn.textContent = 'Delete';
      deleteBtn.addEventListener('click', async () => {
        await observationService.delete(state.date);
        overlay.remove();
        onSave?.();
      });
      actions.appendChild(deleteBtn);
    }

    const saveBtn = document.createElement('button');
    saveBtn.className = 'btn btn-primary';
    saveBtn.textContent = 'Save';
    saveBtn.addEventListener('click', async () => {
      const stampOverride = state.isBIP ? ('yellow' as const) : undefined;
      const obs: Observation = {
        ...(current ?? {}),
        date: state.date,
        bleeding: state.bleeding,
        brown: state.brown || undefined,
        mucusStretch: state.mucusStretch,
        mucusCharacteristics: state.mucusCharacteristics.length > 0 ? state.mucusCharacteristics : undefined,
        frequency: state.frequency,
        isPeakDay: state.isPeakDay,
        isCycleStart: state.isCycleStart || undefined,
        stampOverride,
        intercourse: state.intercourse,
        notes: state.notes || undefined,
        stamp: determineStamp({
          date: state.date,
          bleeding: state.bleeding,
          brown: state.brown || undefined,
          mucusStretch: state.mucusStretch,
          mucusCharacteristics: state.mucusCharacteristics.length > 0 ? state.mucusCharacteristics : undefined,
          isPeakDay: state.isPeakDay,
          stampOverride,
        }),
      };

      await observationService.save(obs);
      overlay.remove();
      onSave?.();
    });
    actions.appendChild(saveBtn);
    form.appendChild(actions);

    modal.appendChild(form);
  }

  async function refreshStampContext() {
    stampContext = await cycleService.getStampContext(state.date);
    render();
  }

  async function refreshNeighbors() {
    const all = await observationService.getAll();
    const idx = all.findIndex(o => o.date === state.date);
    if (idx < 0) {
      neighbors = {};
    } else {
      neighbors = {
        prev: idx > 0 ? all[idx - 1].date : undefined,
        next: idx < all.length - 1 ? all[idx + 1].date : undefined,
      };
    }
    render();
  }

  async function loadObservation(date: string) {
    const obs = await observationService.getByDate(date);
    if (!obs) return;
    current = obs;
    state.date = obs.date;
    state.bleeding = obs.bleeding;
    state.brown = obs.brown ?? false;
    state.mucusStretch = obs.mucusStretch;
    state.mucusCharacteristics = obs.mucusCharacteristics ? [...obs.mucusCharacteristics] : [];
    state.frequency = obs.frequency;
    state.isPeakDay = obs.isPeakDay ?? false;
    state.isCycleStart = obs.isCycleStart ?? false;
    state.isBIP = obs.stampOverride === 'yellow' || obs.stampOverride === 'yellowBaby';
    state.intercourse = obs.intercourse ?? false;
    state.notes = obs.notes ?? '';
    overlay.setAttribute('aria-label', 'Edit Observation');
    render();
    refreshStampContext();
    refreshNeighbors();
  }

  render();
  refreshStampContext();
  if (current) refreshNeighbors();

  overlay.appendChild(modal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });

  // Focus trap: keep Tab cycling within the modal
  overlay.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      overlay.remove();
      return;
    }
    if (e.key === 'Tab') {
      const focusable = modal.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
  });

  document.body.appendChild(overlay);

  // Focus the first focusable element in the modal
  requestAnimationFrame(() => {
    const first = modal.querySelector<HTMLElement>('button, input, textarea');
    first?.focus();
  });
}

// Helper: section label
function sectionLabel(text: string): HTMLElement {
  const el = document.createElement('div');
  el.className = 'section-label';
  el.textContent = text;
  return el;
}

// Helper: toggle button group
function toggleGroup(
  items: { value: string; label: string; active: boolean; colorHint?: string }[],
  onToggle: (value: string) => void,
  singleSelect: boolean
): HTMLElement {
  const group = document.createElement('div');
  group.className = 'toggle-group';

  for (const item of items) {
    const btn = document.createElement('button');
    btn.className = `toggle-btn ${item.active ? 'active' : ''} ${item.colorHint ? 'toggle-hint-' + item.colorHint : ''}`.trim();
    btn.textContent = item.label;
    btn.addEventListener('click', () => onToggle(item.value));
    group.appendChild(btn);
  }

  // Add "None" button for single-select
  if (singleSelect) {
    // Already handled by toggling off
  }

  return group;
}

// Helper: switch toggle
function createSwitch(checked: boolean, onChange: (v: boolean) => void): HTMLElement {
  const label = document.createElement('label');
  label.className = 'switch';
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.checked = checked;
  input.addEventListener('change', () => onChange(input.checked));
  const slider = document.createElement('span');
  slider.className = 'switch-slider';
  label.appendChild(input);
  label.appendChild(slider);
  return label;
}
