import { Injectable } from '@nestjs/common';
import { FitParserService } from './fit-parser.service';
import { IActivityParser } from './interfaces/activity-parser.interface';

@Injectable()
export class ParserRegistryService {
    constructor( private readonly fitParserService: FitParserService ) {}

    getParserFromExtension(extension: string | undefined): IActivityParser | null {
        if (!extension) {
            return null;
        }
        switch (extension.toLowerCase()) {
            case 'fit':
                return this.fitParserService;
            default:
                return null;
        }
    }
}