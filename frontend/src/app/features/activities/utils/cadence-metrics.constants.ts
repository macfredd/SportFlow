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

/** Cadence vs speed heatmap bucket sizes (configurable). */
export const CADENCE_SPEED_HEATMAP_SPEED_BUCKET_MPS = 0.25;
export const CADENCE_SPEED_HEATMAP_CADENCE_BUCKET = 2;

/**
 * Sample-density gradient aligned with cadence zone palette (low → high frequency).
 */
/** Inset on category axes so outer heatmap cells do not sit on axis lines. */
export const CADENCE_HEATMAP_AXIS_BOUNDARY_GAP = true;

export const CADENCE_HEATMAP_FREQUENCY_COLORS = [
  '#F8FAFC',
  '#6C9FF8',
  '#76C7C0',
  '#F28C7B',
  '#B45348',
] as const;
