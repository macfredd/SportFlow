import { Injectable } from '@nestjs/common';
import { ParserRegistryService } from 'src/modules/parser/parser-registry.service';

@Injectable()
export class ActivityService {

  constructor( private readonly parserRegistryService: ParserRegistryService ) {}

  async parseActivity(file: Express.Multer.File): Promise<{ detectedFormat: string }> {
    const extension = file.originalname.split('.').pop()?.toLowerCase();
    const parser = this.parserRegistryService.getParserFromExtension(extension);
    if (!parser) {
      throw new Error(`Unsupported file format: ${extension}`);
    }
    return parser.parse(file.buffer);
  }
}
