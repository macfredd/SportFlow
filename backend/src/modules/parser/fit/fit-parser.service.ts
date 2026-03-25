import { Injectable } from '@nestjs/common';
import { IActivityParser } from '../interfaces/activity-parser.interface';
import FitParser from 'fit-file-parser';
import { ParsedActivity } from '../dto/parsed-activity.dto';
import { toDate } from '../helpers/date.helper';
import { mapRecordToTrackPoint } from './fit-record-mapper.helper';
import { FitRecord } from './fit-record.interface';

@Injectable()
export class FitParserService implements IActivityParser {
  async parse(buffer: Buffer): Promise<ParsedActivity> {
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

    const session = fitObject.activity?.sessions?.[0];

    const parsedActivity: ParsedActivity = {
      sport: session?.sport ?? '',
      startTime: toDate(session?.start_time),
      endTime: toDate(session?.timestamp),
      durationSeconds: session?.total_elapsed_time ?? null,
      distanceMeters: session?.total_distance ?? null,
      elevationGainMeters: session?.total_ascent ?? null,
      elevationLossMeters: session?.total_descent ?? null,
      avgSpeed: session?.avg_speed ?? null,
      maxSpeed: session?.max_speed ?? null,
      avgHeartRate: session?.avg_heart_rate ?? null,
      maxHeartRate: session?.max_heart_rate ?? null,
      totalCalories: session?.total_calories ?? null,
      fileSourceType: 'FIT',
      trackPoints: [],
    };

    const records = (session?.laps?.flatMap((lap) => lap.records ?? []) ??
      []) as FitRecord[];

    parsedActivity.trackPoints = records.map((record) =>
      mapRecordToTrackPoint(record),
    );

    return parsedActivity;
  }

  getSupportedExtensions(): string[] {
    return ['.fit'];
  }
}
