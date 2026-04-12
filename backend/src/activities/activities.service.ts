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

@Injectable()
export class ActivityService {
  constructor(
    @InjectRepository(Activity)
    private readonly activityRepository: Repository<Activity>,
    @InjectRepository(TrackPoint)
    private readonly trackPointRepository: Repository<TrackPoint>,
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

  async findLastestActivity(userId: string): Promise<Activity | null> {
    return this.activityRepository.findOne({
      where: { user: { id: userId } },
      order: { start_time: 'DESC' },
    });
  }
}
