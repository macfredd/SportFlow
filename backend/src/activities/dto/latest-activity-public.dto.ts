import { SportType } from '../../common/enums';
import { DistancePublicShape } from '../activity-display.util';

export class LatestActivityPublicDto {
  id!: string;
  sport_type!: SportType;
  duration!: string;
  distance!: DistancePublicShape | null;
  started_ago!: string;
}
