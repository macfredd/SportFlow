import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ActivityService } from './activities.service';

@Controller('users/:userId/activities')
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Get()
  getActivities(@Param('userId') userId: string) {
    const id = userId?.trim();
    if (!id) {
      throw new BadRequestException('userId path parameter is required');
    }
    return this.activityService.findAll(id);
  }

  @Get(':activityId/trackpoints')
  async getTrackPoints(
    @Param('userId') userId: string,
    @Param('activityId') activityId: string,
  ) {
    const uid = userId?.trim();
    if (!uid) {
      throw new BadRequestException('userId path parameter is required');
    }
    const trackPoints = await this.activityService.findTrackPointsByActivityId(
      activityId,
      uid,
    );
    if (trackPoints === null) {
      throw new NotFoundException('Activity not found');
    }
    return trackPoints;
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  uploadActivity(
    @UploadedFile() file: Express.Multer.File,
    @Param('userId') userId: string,
  ) {
    const id = userId?.trim();
    if (!id) {
      throw new BadRequestException('userId path parameter is required');
    }
    return this.activityService.uploadAndSave(file, id);
  }
}
