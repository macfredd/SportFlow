import { ParsedActivity } from '../dto/parsed-activity.dto';

export interface IActivityParser {
  parse(buffer: Buffer): Promise<ParsedActivity>;
  getSupportedExtensions(): string[];
}
