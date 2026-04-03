import {
  BadRequestException,
  Controller,
  Get,
  Headers,
  NotFoundException,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ActivityService } from './activities.service';

const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function requireDevUserId(raw: string | string[] | undefined): string {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (!v?.trim()) {
    throw new BadRequestException(
      'Missing X-User-Id header (temporary local dev; send your user UUID).',
    );
  }
  const id = v.trim();
  if (!UUID_V4.test(id)) {
    throw new BadRequestException('X-User-Id must be a valid UUID');
  }
  return id;
}

@Controller('activities')
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Get()
  getActivities(@Headers('x-user-id') userIdHeader: string | string[] | undefined) {
    const userId = requireDevUserId(userIdHeader);
    return this.activityService.findAll(userId);
  }

  @Get(':id/trackpoints')
  async getTrackPoints(
    @Param('id') id: string,
    @Headers('x-user-id') userIdHeader: string | string[] | undefined,
  ) {
    const userId = requireDevUserId(userIdHeader);
    const trackPoints = await this.activityService.findTrackPointsByActivityId(
      id,
      userId,
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
    @Headers('x-user-id') userIdHeader: string | string[] | undefined,
  ) {
    const userId = requireDevUserId(userIdHeader);
    return this.activityService.uploadAndSave(file, userId);
  }
}
