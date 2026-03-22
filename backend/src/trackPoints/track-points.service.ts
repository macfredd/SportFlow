import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TrackPoint } from './entities/track-point.entity';
import { Repository } from 'typeorm';

@Injectable()
export class TrackPointsService {
    constructor(
        @InjectRepository(TrackPoint)
        private readonly trackPointRepository: Repository<TrackPoint>,
    ) {}

    async create(trackPoint: Partial<TrackPoint>): Promise<TrackPoint> {
        const entity = this.trackPointRepository.create(trackPoint);
        return this.trackPointRepository.save(entity);
    }

    async findAll(): Promise<TrackPoint[]> {
        return this.trackPointRepository.find();
    }

    async findOneById(id: string): Promise<TrackPoint | null> {
        return this.trackPointRepository.findOne({ where: { id } });
    }
    
}