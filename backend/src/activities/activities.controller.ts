import { Controller, Get, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { ActivityService } from './activities.service';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('activities')
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadActivity(@UploadedFile() file: Express.Multer.File): Promise<{ filename: string; size: number; detectedFormat: string }> {

    const result = await this.activityService.parseActivity(file);

    return { filename: file.originalname, size: file.size, detectedFormat: result.detectedFormat };
  }
}
