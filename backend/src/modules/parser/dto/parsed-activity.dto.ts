import { ParsedTrackPoint } from './parsed-track-point.dto';

export interface ParsedActivity {
  sport: string;
  startTime: Date;
  endTime: Date;
  durationSeconds: number | null;
  distanceMeters: number | null;
  elevationGainMeters: number | null;
  elevationLossMeters: number | null;
  avgSpeed: number | null;
  maxSpeed: number | null;
  avgHeartRate: number | null;
  maxHeartRate: number | null;
  totalCalories: number | null;
  fileSourceType: 'FIT' | 'GPX';
  trackPoints: ParsedTrackPoint[];
}
