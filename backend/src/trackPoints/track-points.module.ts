import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrackPoint } from './entities/track-point.entity';

@Module({
    imports: [TypeOrmModule.forFeature([TrackPoint])],
    exports: [TypeOrmModule],
    controllers: [],
    providers: [],
})
export class TrackPointsModule {}