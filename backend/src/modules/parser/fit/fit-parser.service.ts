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
      durationSeconds: session?.total_elapsed_time ?? 0,
      distanceMeters: session?.total_distance ?? 0,
      elevationGainMeters: session?.total_ascent ?? 0,
      elevationLossMeters: session?.total_descent ?? 0,
      avgSpeed: session?.avg_speed ?? 0,
      maxSpeed: session?.max_speed ?? 0,
      avgHeartRate: session?.avg_heart_rate ?? 0,
      maxHeartRate: session?.max_heart_rate ?? 0,
      totalCalories: session?.total_calories ?? 0,
      fileSourceType: 'FIT',
      trackPoints: [],
    };

    const records = (session?.laps?.flatMap((lap) => lap.records ?? []) ??
      []) as FitRecord[];

    parsedActivity.trackPoints = records
      .filter((record) => (record.timer_time ?? -1) >= 0)
      .map((record) => mapRecordToTrackPoint(record));

    return parsedActivity;
  }

  getSupportedExtensions(): string[] {
    return ['.fit'];
  }
}
