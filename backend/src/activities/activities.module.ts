import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Activity } from './entities/activity.entity';
import { TrackPoint } from '../trackPoints/entities/track-point.entity';
import { ActivityService } from './activities.service';
import { ActivityController } from './activities.controller';
import { ParserModule } from '../modules/parser/parser.module';

@Module({
  imports: [TypeOrmModule.forFeature([Activity, TrackPoint]), ParserModule],
  exports: [TypeOrmModule],
  controllers: [ActivityController],
  providers: [ActivityService],
})
export class ActivitiesModule {}
