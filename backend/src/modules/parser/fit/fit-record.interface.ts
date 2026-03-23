export interface FitRecord {
  timestamp?: string | Date;
  elapsed_time?: number;
  timer_time?: number;
  cadence?: number;
  speed?: number;
  position_lat?: number;
  position_long?: number;
  altitude?: number;
  heart_rate?: number;
}
