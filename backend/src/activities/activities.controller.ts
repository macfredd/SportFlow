import { Controller, Get } from '@nestjs/common';
import { ActivityService } from './activities.service';

@Controller('activities')
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Get()
  getActivities(): string {
    return this.activityService.getStatus();
  }
}
