import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { TrackPointsService } from './track-points.service';
import { TrackPoint } from './entities/track-point.entity';

@Controller('track-points')
export class TrackPointsController {
    constructor(private readonly trackPointsService: TrackPointsService) {}
    
    @Get(':id')
    async findById(@Param('id') id: string): Promise<TrackPoint> {
        const trackPoint = await this.trackPointsService.findOneById(id);
        
        if (!trackPoint) {
            throw new NotFoundException('Track point not found');
        }
        return trackPoint;
    }
}