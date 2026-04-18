import { SportType } from '../../common/enums';
import { DistancePublicValue } from '../shared/display';

export class LatestActivityPublicDto {
  id!: string;
  sport_type!: SportType;
  duration_seconds!: number;
  distance!: DistancePublicValue | null;
  start_time!: Date;
}
