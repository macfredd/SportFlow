export type SportType = 'walking' | 'running' | 'cycling';
export type FileSourceType = 'FIT' | 'TCX' | 'GPX';
export type ActivityDetailDistanceUnit = 'km' | 'mi';
export type ActivityDetailSpeedUnit = 'kmh' | 'mph';

/** Shape returned by `GET /users/:userId/activities` (snake_case). */
export interface Activity {
  readonly id: string;
  readonly sport_type: SportType;
  readonly start_time: string;
  readonly end_time: string;
  readonly duration_seconds: number;
  readonly distance_meters: string | number;
  readonly elevation_gain_meters: string | number | null;
  readonly elevation_loss_meters: string | number | null;
  readonly max_speed: string | number | null;
  readonly avg_speed: string | number | null;
  readonly max_heart_rate: number | null;
  readonly avg_heart_rate: number | null;
  readonly total_calories: number | null;
  readonly file_source_type: FileSourceType;
  readonly created_at: string;
}

/** Shape returned by `GET /users/:userId/activities/:activityId` (detail summary). */
export interface ActivityDetailSummary {
  readonly id: string;
  readonly sport_type: SportType;
  readonly start_time: string;
  readonly end_time: string;
  readonly duration_seconds: number;
  readonly distance: {
    readonly value: number;
    readonly unit: ActivityDetailDistanceUnit;
  };
  readonly elevation_gain_meters: number;
  readonly elevation_loss_meters: number;
  readonly max_speed: {
    readonly value: number;
    readonly unit: ActivityDetailSpeedUnit;
  };
  readonly avg_speed: {
    readonly value: number;
    readonly unit: ActivityDetailSpeedUnit;
  };
  readonly max_heart_rate: number | null;
  readonly avg_heart_rate: number | null;
  readonly total_calories: number | null;
}

/** Shape returned by `GET /users/:userId/activities/latest`. */
export interface LastActivitySummary {
  readonly id: string;
  readonly sport_type: SportType;
  readonly duration_seconds: number;
  readonly distance: {
    readonly value: number;
    readonly unit: 'km' | 'mi';
  } | null;
  /** ISO 8601 (UTC). Relative “ago” copy is built on the client with Transloco. */
  readonly start_time: string;
}

/** Shape returned by `GET /users/:userId/activities/total-by-sport-type`. */
export interface ActivitiesBySportType {
  readonly sport_type: SportType;
  readonly total: number;
}

/** Shape returned by `GET /users/:userId/activities/:activityId/route`. */
export interface TrackPointRoute {
  readonly id: string;
  readonly latitude: number;
  readonly longitude: number;
}
