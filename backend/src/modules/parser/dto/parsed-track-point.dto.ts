export interface ParsedTrackPoint {
  timestamp: Date;
  latitude: number | null;
  longitude: number | null;
  altitude: number | null;
  speed: number | null;
  heartRate: number | null;
  cadence: number | null;
  elapsedTimeSeconds: number | null;
}
