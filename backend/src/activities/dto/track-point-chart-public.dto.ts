import { DistanceUnit } from '@/users/enums';
import { SpeedUnit } from '@/users/enums/speed-unit.enum';

export interface TrackPointChartPublicDto {
  activity_id: string;
  preferred_distance_unit: DistanceUnit;
  preferred_speed_unit: SpeedUnit;
  track_points: TrackPointChartDetailPublicDto[];
}

export interface TrackPointChartDetailPublicDto {
  id: string;
  date_time: Date;
  accumulated_distance_meters: number;
  altitude_meters: number | null;
  speed_m_s: number | null;
  cadence: number | null;
  heart_rate: number | null;
}
