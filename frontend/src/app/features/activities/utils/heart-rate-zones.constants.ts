/** Shared palette and labels for heart-rate zone charts (Z1–Z5). */
export const HEART_RATE_ZONE_COLORS = [
  '#4e79a7',
  '#59a14f',
  '#edc948',
  '#f28e2b',
  '#e15759',
] as const;

export const HEART_RATE_ZONE_I18N_KEYS = [
  'activity.heartRateZones.zoneZ1',
  'activity.heartRateZones.zoneZ2',
  'activity.heartRateZones.zoneZ3',
  'activity.heartRateZones.zoneZ4',
  'activity.heartRateZones.zoneZ5',
] as const;

/** Short in-bar labels (language-independent). */
export const HEART_RATE_ZONE_SHORT_LABELS = ['Z1', 'Z2', 'Z3', 'Z4', 'Z5'] as const;

export type HeartRateZoneI18nKey = (typeof HEART_RATE_ZONE_I18N_KEYS)[number];

export const HEART_RATE_ZONE_COUNT = HEART_RATE_ZONE_COLORS.length;
