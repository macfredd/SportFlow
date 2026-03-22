import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Activity } from './entities/activity.entity';
import { ActivityService } from './activities.service';
import { ActivityController } from './activities.controller';
import { ParserModule } from 'src/modules/parser/parser.module';

@Module({
  imports: [TypeOrmModule.forFeature([Activity]), ParserModule],
  exports: [TypeOrmModule],
  controllers: [ActivityController],
  providers: [ActivityService],
})
export class ActivitiesModule {}
