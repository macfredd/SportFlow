import type { SportType } from '../../../shared/models/activity.model';

/** Minimum implied speed (m/s) to treat a segment as moving (aligned with backend moving-time heuristics). */
export function minSpeedMpsForSport(sportType: SportType): number {
  switch (sportType) {
    case 'walking':
      return 0.15;
    case 'running':
      return 0.55;
    case 'cycling':
      return 0.35;
  }
}

/** Skip intervals longer than this (s) between track points. */
export const CADENCE_MAX_SEGMENT_DT_SEC = 120;
