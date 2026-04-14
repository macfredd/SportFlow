import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Activity } from './entities/activity.entity';
import { TrackPoint } from '../trackPoints/entities/track-point.entity';
import { UserConfig } from '../users/entities/user-config.entity';
import { ActivityService } from './activities.service';
import { ActivityController } from './activities.controller';
import { ParserModule } from '../modules/parser/parser.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Activity, TrackPoint, UserConfig]),
    ParserModule,
    UsersModule,
  ],
  exports: [TypeOrmModule],
  controllers: [ActivityController],
  providers: [ActivityService],
})
export class ActivitiesModule {}
