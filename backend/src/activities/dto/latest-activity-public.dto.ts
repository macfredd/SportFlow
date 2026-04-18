import { SportType } from '../../common/enums';
import { DistancePublicShape } from '../shared/display';

export class LatestActivityPublicDto {
  id!: string;
  sport_type!: SportType;
  duration!: string;
  distance!: DistancePublicShape | null;
  start_time!: Date;
}
