import { SportType } from '../../common/enums';
import { DistancePublicValue } from '../shared/display';
import { SpeedPublicValue } from '../shared/display/speed-display';

export interface ActivityDetailPublicDto {
  id: string;
  sport_type: SportType;
  start_time: Date;
  end_time: Date;
  duration_seconds: number;
  distance: DistancePublicValue | null;
  elevation_gain_meters: number | null;
  elevation_loss_meters: number | null;
  max_speed: SpeedPublicValue | null;
  avg_speed: SpeedPublicValue | null;
  max_heart_rate: number | null;
  avg_heart_rate: number | null;
  total_calories: number | null;
}