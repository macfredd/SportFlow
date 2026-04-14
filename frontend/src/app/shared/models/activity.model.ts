export type SportType = 'walking' | 'running' | 'cycling';

export type FileSourceType = 'FIT' | 'TCX' | 'GPX';

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

/** Shape returned by `GET /users/:userId/activities/latest`. */
export interface LastActivitySummary {
  readonly id: string;
  readonly sport_type: SportType;
  readonly duration: string;
  readonly distance: {
    readonly display: string;
    readonly unit: string;
  };
  readonly started_ago: string;
}
