/** `GET /users/:userId/config` */
export interface UserConfig {
  readonly id: string;
  readonly preferred_weight_unit: string;
  readonly preferred_height_unit: string;
  readonly preferred_distance_unit: string;
  readonly preferred_glucose_unit: string;
  readonly dashboard_widgets: unknown | null;
  readonly updated_at: string;
}
