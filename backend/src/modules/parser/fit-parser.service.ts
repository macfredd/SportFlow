import { Injectable } from '@nestjs/common';
import { IActivityParser } from './interfaces/activity-parser.interface';

@Injectable()
export class FitParserService implements IActivityParser {
  async parse(buffer: Buffer): Promise<{ detectedFormat: string }> {
    return { detectedFormat: 'fit' };
  }

  getSupportedExtensions(): string[] {
    return ['.fit'];
  }
}
