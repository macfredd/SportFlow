import { Controller, Get, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { ActivityService } from './activities.service';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('activities')
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadActivity(@UploadedFile() file: Express.Multer.File): Promise<{ data: any }> {

    const result = await this.activityService.parseActivity(file);

    return {  data: (result as any).data };
  }
}
