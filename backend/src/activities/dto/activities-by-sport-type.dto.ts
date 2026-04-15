import { SportType } from '../../common/enums/sport-type.enum';

export interface ActivitiesBySportType {
  sport_type: SportType;
  total: number;
}
