export interface ParsedTrackPoint {
    timestamp: Date;
    latitude: number;
    longitude: number;
    altitude: number;
    speed: number;
    heartRate: number | null;
    cadence: number | null;
    elapsedTimeSeconds: number | null;
  }