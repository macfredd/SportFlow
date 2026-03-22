import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrackPoint } from './entities/track-point.entity';
import { TrackPointsService } from './track-points.service';
import { TrackPointsController } from './track-points.controller';

@Module({
  imports: [TypeOrmModule.forFeature([TrackPoint])],
  exports: [TypeOrmModule],
  controllers: [TrackPointsController],
  providers: [TrackPointsService],
})
export class TrackPointsModule {}
