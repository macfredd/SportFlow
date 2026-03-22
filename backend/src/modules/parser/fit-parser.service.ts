import { Injectable } from '@nestjs/common';
import { IActivityParser } from './interfaces/activity-parser.interface';
import FitParser from 'fit-file-parser';

@Injectable()
export class FitParserService implements IActivityParser {
  async parse(buffer: Buffer): Promise<{ detectedFormat: string; data: any }> {
    const fitParser = new FitParser({
      force: true,
      speedUnit: 'm/s',
      lengthUnit: 'm',
      temperatureUnit: 'celsius',
      elapsedRecordField: true,
      mode: 'cascade',
    });

    const arrayBuffer = new Uint8Array(buffer).buffer;
    const fitObject = await fitParser.parseAsync(arrayBuffer);

    return { detectedFormat: 'fit', data: fitObject };
  }

  getSupportedExtensions(): string[] {
    return ['.fit'];
  }
}
