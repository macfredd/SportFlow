import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Activity } from './entities/activity.entity';
import { TrackPoint } from '../trackPoints/entities/track-point.entity';
import { ParserRegistryService } from '../modules/parser/parser-registry.service';

@Injectable()
export class ActivityService {
  constructor(
    @InjectRepository(Activity)
    private readonly activityRepository: Repository<Activity>,
    private readonly parserRegistryService: ParserRegistryService,
  ) {}

  async create(activity: Partial<Activity>): Promise<Activity> {
    const entity = this.activityRepository.create(activity);
    return this.activityRepository.save(entity);
  }

  async findAll(): Promise<Activity[]> {
    return this.activityRepository.find({
      order: { start_time: 'DESC' },
    });
  }

  async remove(id: string): Promise<void> {
    await this.activityRepository.delete(id);
  }

  async findOneById(id: string): Promise<Activity | null> {
    return this.activityRepository.findOne({ where: { id } });
  }

  async findTrackPointsByActivityId(activityId: string): Promise<TrackPoint[] | null> {
    const activity = await this.activityRepository.findOne({
      where: { id: activityId },
      relations: ['trackPoints'],
    });
    if (!activity) return null;
    return activity.trackPoints;
  }

  async parseActivity(file: Express.Multer.File): Promise<{ detectedFormat: string }> {
    const extension = file.originalname.split('.').pop()?.toLowerCase();
    const parser = this.parserRegistryService.getParserFromExtension(extension);
    if (!parser) {
      throw new Error(`Unsupported file format: ${extension}`);
    }
    return parser.parse(file.buffer);
  }
}
