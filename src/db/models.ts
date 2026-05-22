// Bleeding codes (intensity only)
export type BleedingCode = 'H' | 'M' | 'L' | 'VL';

// Mucus stretch codes (numeric descriptors)
export type MucusStretchCode = '0' | '2' | '2W' | '4' | '6' | '8' | '10' | '10DL' | '10SL' | '10WL';

// Mucus characteristic modifiers (per Figure 6.3 of "The Creighton Model
// FertilityCare System", Hilgers, ISBN 0-9626485-4-X). C/K (cloudy/clear) is
// expressed by multi-selecting both C and K, which renders as "CK" in the
// chart code.
export type MucusCharacteristic = 'C' | 'K' | 'L' | 'B' | 'G' | 'Y' | 'P';

// Observation frequency
export type FrequencyCode = 'x1' | 'x2' | 'x3' | 'AD';

// Stamp types used in Creighton charting
export type StampColor = 'green' | 'red' | 'white' | 'yellow';
export type StampType =
  | 'green'       // Dry / infertile
  | 'greenBaby'   // Potentially fertile but dry
  | 'white'       // Mucus present (not in fertile window)
  | 'whiteBaby'   // Fertile (mucus present, in fertile window)
  | 'whiteBabyP'  // Peak day
  | 'whiteBaby1'  // Post-peak count day 1
  | 'whiteBaby2'  // Post-peak count day 2
  | 'whiteBaby3'  // Post-peak count day 3
  | 'greenBaby1'  // Post-peak count day 1 (dry)
  | 'greenBaby2'  // Post-peak count day 2 (dry)
  | 'greenBaby3'  // Post-peak count day 3 (dry)
  | 'yellowBaby1' // Post-peak count day 1 + BIP
  | 'yellowBaby2' // Post-peak count day 2 + BIP
  | 'yellowBaby3' // Post-peak count day 3 + BIP
  | 'red'         // Menstrual bleeding
  | 'yellow'      // Unchanging discharge (Base Infertile Pattern)
  | 'yellowBaby'; // Potentially fertile yellow

// A single day's observation
export interface Observation {
  id?: number;
  date: string; // ISO YYYY-MM-DD, unique index
  cycleId?: number;
  bleeding?: BleedingCode;
  brown?: boolean;
  mucusStretch?: MucusStretchCode;
  mucusCharacteristics?: MucusCharacteristic[];
  frequency?: FrequencyCode;
  isPeakDay: boolean;
  isCycleStart?: boolean; // Manual: force this observation to be the first day of a new cycle
  stampOverride?: StampType; // Manual override
  stamp?: StampType; // Computed
  intercourse?: boolean;
  notes?: string;
}

// A menstrual cycle
export interface Cycle {
  id?: number;
  startDate: string;
  endDate?: string;
  peakDay?: string;
  length?: number;
  notes?: string;
}

// App settings (singleton row)
export interface UserSettings {
  id: number; // Always 1
  bipDescription?: string;
  defaultView: 'chart' | 'calendar';
  reminderTime?: string;
  theme?: 'light' | 'dark' | 'system';
}
