import type { BleedingCode, MucusStretchCode, MucusCharacteristic, FrequencyCode } from '../db/models';

export const BLEEDING_LABELS: Record<BleedingCode, string> = {
  H: 'Heavy',
  M: 'Moderate',
  L: 'Light',
  VL: 'Very Light',
};

export const MUCUS_STRETCH_ORDER: MucusStretchCode[] = ['0', '2', '2W', '4', '6', '8', '10', '10DL', '10SL', '10WL'];

export const MUCUS_STRETCH_LABELS: Record<MucusStretchCode, string> = {
  '0': 'Dry',
  '2': 'Damp',
  '2W': 'Wet',
  '4': 'Shiny',
  '6': 'Sticky (¼")',
  '8': 'Tacky (½")',
  '10': 'Stretchy (1"+)',
  '10DL': 'Damp / Lubricative',
  '10SL': 'Shiny / Lubricative',
  '10WL': 'Wet / Lubricative',
};

export const MUCUS_CHAR_LABELS: Record<MucusCharacteristic, string> = {
  C: 'Cloudy',
  K: 'Clear',
  L: 'Lubricative',
  P: 'Pasty',
  G: 'Gummy',
  B: 'Brown',
  Y: 'Yellow',
};

export const FREQUENCY_LABELS: Record<FrequencyCode, string> = {
  x1: 'Once',
  x2: 'Twice',
  x3: 'Three+',
  AD: 'All Day',
};

/** Build the short alphanumeric CrMS observation code string */
export function buildObservationCode(
  bleeding?: BleedingCode,
  mucusStretch?: MucusStretchCode,
  mucusChars?: MucusCharacteristic[],
  frequency?: FrequencyCode,
  brown?: boolean
): string {
  const parts: string[] = [];

  if (bleeding) {
    parts.push(bleeding);
  }

  if (brown) {
    parts.push('B');
  }

  if (mucusStretch && mucusStretch !== '0') {
    let mucusStr = mucusStretch as string;
    if (mucusChars && mucusChars.length > 0) {
      mucusStr += mucusChars.join('');
    }
    parts.push(mucusStr);
  } else if (mucusStretch === '0') {
    parts.push('0');
  }

  if (frequency) {
    parts.push(frequency);
  }

  return parts.join(' ') || '—';
}

/** Returns true if the mucus observation indicates peak-type mucus */
export function isPeakTypeMucus(
  stretch?: MucusStretchCode,
  chars?: MucusCharacteristic[]
): boolean {
  if (!stretch) return false;
  const stretchNum = parseInt(stretch, 10);
  if (isNaN(stretchNum)) return false;
  // Peak-type: stretchy (10), or lubricative sensation, or clear
  if (stretchNum >= 10) return true;
  if (chars?.includes('K')) return true;
  if (chars?.includes('L')) return true;
  return false;
}
