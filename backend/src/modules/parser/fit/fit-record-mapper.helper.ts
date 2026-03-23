import { ParsedTrackPoint } from '../dto/parsed-track-point.dto';
import { FitRecord } from './fit-record.interface';
import { toDate } from '../helpers/date.helper';

export function mapRecordToTrackPoint(record: FitRecord): ParsedTrackPoint {
  return {
    timestamp: toDate(record.timestamp),
    latitude: record.position_lat ?? 0,
    longitude: record.position_long ?? 0,
    altitude: record.altitude ?? 0,
    speed: record.speed ?? 0,
    heartRate: record.heart_rate ?? null,
    cadence: record.cadence ?? null,
    elapsedTimeSeconds: record.elapsed_time ?? record.timer_time ?? null,
  };
}
