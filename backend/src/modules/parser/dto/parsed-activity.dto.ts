import { ParsedTrackPoint } from './parsed-track-point.dto';

export interface ParsedActivity {
  sport: string;
  startTime: Date;
  endTime: Date;
  durationSeconds: number;
  distanceMeters: number;
  elevationGainMeters: number;
  elevationLossMeters: number;
  avgSpeed: number | null;
  maxSpeed: number | null;
  avgHeartRate: number | null;
  maxHeartRate: number | null;
  totalCalories: number | null;
  fileSourceType: 'FIT';
  trackPoints: ParsedTrackPoint[];
}
