import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ActivityService } from './activities.service';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('activities')
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Get()
  async getActivities() {
    return this.activityService.findAll();
  }

  @Get(':id/trackpoints')
  async getTrackPoints(@Param('id') id: string) {
    const trackPoints = await this.activityService.findTrackPointsByActivityId(id);
    if (trackPoints === null) {
      throw new NotFoundException('Activity not found');
    }
    return trackPoints;
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadActivity(@UploadedFile() file: Express.Multer.File): Promise<{ data: any }> {

    const result = await this.activityService.parseActivity(file);

    return {  data: (result as any).data };
  }
}
