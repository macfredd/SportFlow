import { Injectable } from '@nestjs/common';
import { FitParserService } from './fit/fit-parser.service';
import { IActivityParser } from './interfaces/activity-parser.interface';
import { GpxParserService } from './gpx/gpx_parser.service';

@Injectable()
export class ParserRegistryService {
    constructor( private readonly fitParserService: FitParserService, private readonly gpxParserService: GpxParserService ) {}

    getParserFromExtension(extension: string | undefined): IActivityParser | null {
        if (!extension) {
            return null;
        }
        switch (extension.toLowerCase()) {
            case 'fit':
                return this.fitParserService;
            case 'gpx':
                return this.gpxParserService;
            default:
                return null;
        }
    }
}