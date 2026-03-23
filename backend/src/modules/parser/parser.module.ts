import { Module } from '@nestjs/common';
import { ParserRegistryService } from './parser-registry.service';
import { FitParserService } from './fit/fit-parser.service';

@Module({
  imports: [],
  exports: [ParserRegistryService, FitParserService],
  controllers: [],
  providers: [ParserRegistryService, FitParserService],
})
export class ParserModule {}