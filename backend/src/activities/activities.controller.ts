import { Controller, Get, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { ActivityService } from './activities.service';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('activities')
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Get()
  getActivities(): string {
    return this.activityService.getStatus();
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  uploadActivity(@UploadedFile() file: Express.Multer.File): { filename: string, size: number } {
    return { filename: file.originalname, size: file.size }
  }
}
