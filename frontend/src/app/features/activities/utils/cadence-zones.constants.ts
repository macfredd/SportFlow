import type { SportType } from '@shared/models/activity.model';

export interface CadenceZoneDefinition {
  readonly minInclusive: number;
  /** `null` = no upper bound (top zone). */
  readonly maxInclusive: number | null;
  readonly color: string;
  readonly i18nKey: CadenceZoneI18nKey;
  readonly shortLabel: string;
}

export const CADENCE_ZONE_I18N_KEYS = [
  'activity.cadenceZones.zoneZ1',
  'activity.cadenceZones.zoneZ2',
  'activity.cadenceZones.zoneZ3',
  'activity.cadenceZones.zoneZ4',
  'activity.cadenceZones.zoneZ5',
] as const;

export type CadenceZoneI18nKey = (typeof CADENCE_ZONE_I18N_KEYS)[number];

/**
 * Low cadence → high cadence, Z1 → Z5.
 * Blue → light blue → teal → green → coral (no bright cyan).
 */
export const CADENCE_ZONE_COLORS = [
  '#4E79A7', // Z1 — very low
  '#6C9FF8', // Z2 — low
  '#76C7C0', // Z3 — moderate (teal)
  '#6BCB77', // Z4 — high
  '#F28C7B', // Z5 — very high (coral)
] as const;

const C = CADENCE_ZONE_COLORS;

/** Default adult running cadence zones (spm). Replaceable by user settings later. */
const RUNNING_CADENCE_ZONES_SPM: readonly CadenceZoneDefinition[] = [
  { minInclusive: 0, maxInclusive: 149, color: C[0], i18nKey: CADENCE_ZONE_I18N_KEYS[0], shortLabel: 'Z1' },
  { minInclusive: 150, maxInclusive: 159, color: C[1], i18nKey: CADENCE_ZONE_I18N_KEYS[1], shortLabel: 'Z2' },
  { minInclusive: 160, maxInclusive: 169, color: C[2], i18nKey: CADENCE_ZONE_I18N_KEYS[2], shortLabel: 'Z3' },
  { minInclusive: 170, maxInclusive: 179, color: C[3], i18nKey: CADENCE_ZONE_I18N_KEYS[3], shortLabel: 'Z4' },
  { minInclusive: 180, maxInclusive: null, color: C[4], i18nKey: CADENCE_ZONE_I18N_KEYS[4], shortLabel: 'Z5' },
];

/** Default adult walking cadence zones (spm). */
const WALKING_CADENCE_ZONES_SPM: readonly CadenceZoneDefinition[] = [
  { minInclusive: 0, maxInclusive: 99, color: C[0], i18nKey: CADENCE_ZONE_I18N_KEYS[0], shortLabel: 'Z1' },
  { minInclusive: 100, maxInclusive: 109, color: C[1], i18nKey: CADENCE_ZONE_I18N_KEYS[1], shortLabel: 'Z2' },
  { minInclusive: 110, maxInclusive: 119, color: C[2], i18nKey: CADENCE_ZONE_I18N_KEYS[2], shortLabel: 'Z3' },
  { minInclusive: 120, maxInclusive: 129, color: C[3], i18nKey: CADENCE_ZONE_I18N_KEYS[3], shortLabel: 'Z4' },
  { minInclusive: 130, maxInclusive: null, color: C[4], i18nKey: CADENCE_ZONE_I18N_KEYS[4], shortLabel: 'Z5' },
];

/** Default adult cycling cadence zones (rpm). */
const CYCLING_CADENCE_ZONES_RPM: readonly CadenceZoneDefinition[] = [
  { minInclusive: 0, maxInclusive: 59, color: C[0], i18nKey: CADENCE_ZONE_I18N_KEYS[0], shortLabel: 'Z1' },
  { minInclusive: 60, maxInclusive: 69, color: C[1], i18nKey: CADENCE_ZONE_I18N_KEYS[1], shortLabel: 'Z2' },
  { minInclusive: 70, maxInclusive: 79, color: C[2], i18nKey: CADENCE_ZONE_I18N_KEYS[2], shortLabel: 'Z3' },
  { minInclusive: 80, maxInclusive: 89, color: C[3], i18nKey: CADENCE_ZONE_I18N_KEYS[3], shortLabel: 'Z4' },
  { minInclusive: 90, maxInclusive: null, color: C[4], i18nKey: CADENCE_ZONE_I18N_KEYS[4], shortLabel: 'Z5' },
];
export function defaultCadenceZonesForSport(sportType: SportType): readonly CadenceZoneDefinition[] {
  switch (sportType) {
    case 'walking':
      return WALKING_CADENCE_ZONES_SPM;
    case 'cycling':
      return CYCLING_CADENCE_ZONES_RPM;
    case 'running':
    default:
      return RUNNING_CADENCE_ZONES_SPM;
  }
}

export function zoneIndexForCadence(
  cadence: number,
  zones: readonly CadenceZoneDefinition[],
): number {
  for (let i = 0; i < zones.length; i++) {
    const z = zones[i];
    if (cadence >= z.minInclusive && (z.maxInclusive === null || cadence <= z.maxInclusive)) {
      return i;
    }
  }
  return zones.length - 1;
}

/** Builds ECharts `visualMap.pieces` for cadence scatter coloring. */
export function cadenceZoneVisualMapPieces(
  zones: readonly CadenceZoneDefinition[],
): { min?: number; max?: number; color: string }[] {
  return zones.map((z) => {
    const piece: { min?: number; max?: number; color: string } = { color: z.color };
    if (z.maxInclusive !== null) {
      piece.max = z.maxInclusive;
    }
    if (z.minInclusive > 0) {
      piece.min = z.minInclusive;
    }
    return piece;
  });
}

/** Human-readable SPM/RPM range for legends (sport-specific thresholds). */
export function formatCadenceZoneRangeLabel(
  zone: CadenceZoneDefinition,
  unit: 'spm' | 'rpm',
): string {
  if (zone.maxInclusive === null) {
    return `≥ ${zone.minInclusive} ${unit}`;
  }
  if (zone.minInclusive <= 0) {
    return `< ${zone.maxInclusive + 1} ${unit}`;
  }
  return `${zone.minInclusive}–${zone.maxInclusive} ${unit}`;
}
