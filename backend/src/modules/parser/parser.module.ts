import { Module } from '@nestjs/common';
import { ParserRegistryService } from './parser-registry.service';
import { FitParserService } from './fit/fit-parser.service';
import { GpxParserService } from './gpx/gpx_parser.service';

@Module({
  imports: [],
  exports: [ParserRegistryService, FitParserService, GpxParserService],
  controllers: [],
  providers: [ParserRegistryService, FitParserService, GpxParserService],
})
export class ParserModule {}
