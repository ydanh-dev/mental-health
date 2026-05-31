import type { TimePeriod } from '../utils/time_context';

export interface MoodEntry {
  gad7: number | null;
  highItems: string[];
  id: string;
  phq9: number | null;
  syncedAt: string | null;
  timePeriod: TimePeriod;
  timestamp: string;
  who5_pct: number;
}
