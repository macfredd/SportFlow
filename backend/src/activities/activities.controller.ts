import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ActivityService } from './activities.service';
import { ActivitiesBySportType } from './dto/activities-by-sport-type.dto';

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

  @Get('total-by-sport-type')
  getTotalActivitiesBySportType(
    @Param('userId') userId: string,
    @Query('days') daysRaw?: string,
  ): Promise<ActivitiesBySportType[]> {
    const id = userId?.trim();
    if (!id) {
      throw new BadRequestException('userId path parameter is required');
    }
    return this.activityService.getTotalActivitiesBySportType(id, daysRaw);
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

  @Get('latest')
  async getLatestActivity(@Param('userId') userId: string) {
    const id = userId?.trim();
    if (!id) {
      throw new BadRequestException('userId path parameter is required');
    }
    const latest = await this.activityService.findLatestActivityPublic(id);
    if (!latest) {
      throw new NotFoundException('No activity found');
    }
    return latest;
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
    if (!file) {
      throw new BadRequestException(
        'No file received. Send multipart form field "file" with the activity binary (e.g. .gpx / .fit).',
      );
    }
    return this.activityService.uploadAndSave(file, id);
  }
}
