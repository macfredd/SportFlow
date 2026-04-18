import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Activity } from './entities/activity.entity';
import { TrackPoint } from '../trackPoints/entities/track-point.entity';
import { ParserRegistryService } from '../modules/parser/parser-registry.service';
import { ParsedActivity } from '../modules/parser/dto/parsed-activity.dto';
import {
  mapParsedActivityToActivity,
  mapParsedTrackPointToTrackPoint,
} from './mappers/parsed-activity.mapper';
import { UserEntity } from '../users/entities/user.entity';
import { UserConfig } from '../users/entities/user-config.entity';
import { DistanceUnit } from '../users/enums';
import { LatestActivityPublicDto } from './dto/latest-activity-public.dto';
import {
  buildDistanceForPublic,
  formatDurationDisplayEs,
} from './activity-display.util';
import { SportType } from 'src/common/enums/sport-type.enum';
import { ActivitiesBySportType } from './dto/activities-by-sport-type.dto';

/** Max window when filtering by `days` (avoids huge scans / abuse). */
export const MAX_ACTIVITY_WINDOW_DAYS = 3650;

@Injectable()
export class ActivityService {
  constructor(
    @InjectRepository(Activity)
    private readonly activityRepository: Repository<Activity>,
    @InjectRepository(TrackPoint)
    private readonly trackPointRepository: Repository<TrackPoint>,
    @InjectRepository(UserConfig)
    private readonly userConfigRepository: Repository<UserConfig>,
    private readonly parserRegistryService: ParserRegistryService,
  ) {}

  async create(activity: Partial<Activity>): Promise<Activity> {
    const entity = this.activityRepository.create(activity);
    return this.activityRepository.save(entity);
  }

  async findAll(userId: string): Promise<Activity[]> {
    return this.activityRepository.find({
      where: { user: { id: userId } },
      order: { start_time: 'DESC' },
    });
  }

  async remove(id: string): Promise<void> {
    await this.activityRepository.delete(id);
  }

  async findOneById(id: string): Promise<Activity | null> {
    return this.activityRepository.findOne({ where: { id } });
  }

  async findTrackPointsByActivityId(
    activityId: string,
    userId: string,
  ): Promise<TrackPoint[] | null> {
    const activity = await this.activityRepository.findOne({
      where: { id: activityId, user: { id: userId } },
      relations: ['trackPoints'],
    });
    if (!activity) return null;
    return activity.trackPoints;
  }

  async parseActivity(file: Express.Multer.File): Promise<ParsedActivity> {
    if (!file.buffer || file.buffer.length === 0) {
      throw new BadRequestException(
        'Uploaded file is empty. Check the file exists on disk (REST clients) or that the browser sent the full body.',
      );
    }

    const extension = file.originalname.split('.').pop()?.toLowerCase();
    const parser = this.parserRegistryService.getParserFromExtension(extension);
    if (!parser) {
      throw new BadRequestException(
        `Unsupported file format: ${extension ?? 'unknown'}`,
      );
    }

    try {
      return await parser.parse(file.buffer);
    } catch (err) {
      if (err instanceof BadRequestException) {
        throw err;
      }
      const message =
        err instanceof Error ? err.message : 'Unknown parse error';
      throw new BadRequestException(
        `Could not parse activity file: ${message}`,
      );
    }
  }

  async uploadAndSave(
    file: Express.Multer.File,
    userId: string,
  ): Promise<Activity> {
    const parsed = await this.parseActivity(file);
    const activityData = mapParsedActivityToActivity(parsed);
    const activity = await this.activityRepository.save(
      this.activityRepository.create({
        ...activityData,
        user: { id: userId } as UserEntity,
      }),
    );

    if (parsed.trackPoints.length > 0) {
      const trackPointsData = parsed.trackPoints.map((tp) =>
        mapParsedTrackPointToTrackPoint(tp, activity.id),
      );
      const trackPoints = this.trackPointRepository.create(trackPointsData);
      await this.trackPointRepository.save(trackPoints);
    }

    return activity;
  }

  async findLatestActivityPublic(
    userId: string,
  ): Promise<LatestActivityPublicDto | null> {
    const activity = await this.activityRepository.findOne({
      where: { user: { id: userId } },
      order: { start_time: 'DESC' },
    });
    if (!activity) {
      return null;
    }

    const config = await this.userConfigRepository.findOne({
      where: { user: { id: userId } },
    });
    const distanceUnit = config?.preferred_distance_unit ?? DistanceUnit.KM;

    return {
      id: activity.id,
      sport_type: activity.sport_type,
      duration: formatDurationDisplayEs(activity.duration_seconds),
      distance: buildDistanceForPublic(activity.distance_meters, distanceUnit),
      start_time: activity.start_time,
    };
  }

  /**
   * Count activities per sport type for a user. If `daysRaw` is set, only activities
   * with `start_time` in the last N days; if omitted or blank, all activities (no date filter).
   */
  async getTotalActivitiesBySportType(
    userId: string,
    daysRaw?: string,
  ): Promise<ActivitiesBySportType[]> {
    let days: number | undefined;
    if (daysRaw?.trim()) {
      const value = Number(daysRaw);
      if (
        !Number.isInteger(value) ||
        value <= 0 ||
        value > MAX_ACTIVITY_WINDOW_DAYS
      ) {
        throw new BadRequestException('days must be a positive integer');
      }
      days = value;
    }

    const qb = this.activityRepository
      .createQueryBuilder('activity')
      .select('activity.sport_type', 'sport_type')
      .addSelect('COUNT(*)', 'total')
      .where('activity.user_id = :userId', { userId })
      .groupBy('activity.sport_type')
      .orderBy('total', 'DESC');

    if (days !== undefined) {
      const cutoff = new Date();
      cutoff.setTime(cutoff.getTime() - days * 24 * 60 * 60 * 1000);
      qb.andWhere('activity.start_time >= :cutoff', { cutoff });
    }

    const rows = await qb.getRawMany<{
      sport_type: string;
      total: string;
    }>();

    return rows.map((row) => ({
      sport_type: row.sport_type as SportType,
      total: Number(row.total),
    }));
  }
}
