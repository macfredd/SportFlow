import { ParsedTrackPoint } from '../dto/parsed-track-point.dto';
import { FitRecord } from './fit-record.interface';
import { toDate } from '../helpers/date.helper';

export function mapRecordToTrackPoint(record: FitRecord): ParsedTrackPoint {
  const hasGps =
    record.position_lat != null && record.position_long != null;
  return {
    timestamp: toDate(record.timestamp),
    latitude: hasGps ? record.position_lat! : null,
    longitude: hasGps ? record.position_long! : null,
    altitude: record.altitude ?? null,
    speed: record.speed ?? null,
    heartRate: record.heart_rate ?? null,
    cadence: record.cadence ?? null,
    elapsedTimeSeconds: record.elapsed_time ?? null,
  };
}
