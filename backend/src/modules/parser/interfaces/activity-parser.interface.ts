export interface IActivityParser {
  parse(buffer: Buffer): Promise<{ detectedFormat: string }>;
  getSupportedExtensions(): string[];
}
