import { Activity } from '../entities/activity.entity';
import { FileSourceType, SportType } from '../../common/enums';
import { ParsedActivity } from '../../modules/parser/dto/parsed-activity.dto';
import { ParsedTrackPoint } from '../../modules/parser/dto/parsed-track-point.dto';
import { TrackPoint } from '../../trackPoints/entities/track-point.entity';

const SPORT_MAP: Record<string, SportType> = {
  walking: SportType.WALKING,
  running: SportType.RUNNING,
  cycling: SportType.CYCLING,
};

export function mapParsedActivityToActivity(parsed: ParsedActivity): Partial<Activity> {
  return {
    sport_type: SPORT_MAP[parsed.sport.toLowerCase()] ?? SportType.WALKING,
    start_time: parsed.startTime,
    end_time: parsed.endTime,
    duration_seconds: parsed.durationSeconds,
    distance_meters: parsed.distanceMeters,
    elevation_gain_meters: parsed.elevationGainMeters,
    elevation_loss_meters: parsed.elevationLossMeters,
    max_speed: parsed.maxSpeed ?? 0,
    avg_speed: parsed.avgSpeed,
    max_heart_rate: parsed.maxHeartRate,
    avg_heart_rate: parsed.avgHeartRate,
    total_calories: parsed.totalCalories,
    file_source_type: FileSourceType[parsed.fileSourceType] ?? FileSourceType.FIT,
  };
}

export function mapParsedTrackPointToTrackPoint(
  parsed: ParsedTrackPoint,
  activityId: string,
): Partial<TrackPoint> {
  return {
    date_time: parsed.timestamp,
    position_latitude: parsed.latitude,
    position_longitude: parsed.longitude,
    speed_m_s: parsed.speed,
    altitude_meters: parsed.altitude,
    cadence: parsed.cadence,
    heart_rate: parsed.heartRate,
    elapsed_time_seconds: parsed.elapsedTimeSeconds,
    activity: { id: activityId } as Activity,
  };
}
