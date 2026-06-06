import { ParsedActivity } from '@/modules/parser/dto/parsed-activity.dto';

export interface IActivityParser {
  parse(buffer: Buffer): Promise<ParsedActivity>;
  getSupportedExtensions(): string[];
}
