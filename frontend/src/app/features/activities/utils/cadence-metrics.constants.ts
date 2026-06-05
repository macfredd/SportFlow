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

/** Time bins for cadence scatter — fixed visual width regardless of activity duration. */
export const CADENCE_DISTRIBUTION_MIN_BINS = 36;
export const CADENCE_DISTRIBUTION_MAX_BINS = 56;
export const CADENCE_DISTRIBUTION_TARGET_POINTS_PER_BIN = 22;
/** Scatter dot diameter (px). ~1.5px radius. */
export const CADENCE_DISTRIBUTION_SYMBOL_SIZE = 3;
/** Hover dot diameter (px). ~4px radius. */
export const CADENCE_DISTRIBUTION_HOVER_SYMBOL_SIZE = 8;
/** Soft overlap without washing out zone colors. */
export const CADENCE_DISTRIBUTION_POINT_OPACITY = 0.88;

/** Chart chrome (axes, grid, average line). */
export const CADENCE_CHART_AXIS_COLOR = '#6B7280';
export const CADENCE_CHART_GRID_COLOR = 'rgba(0, 0, 0, 0.06)';
export const CADENCE_CHART_AVG_LINE_COLOR = 'rgba(156, 163, 175, 0.5)';
