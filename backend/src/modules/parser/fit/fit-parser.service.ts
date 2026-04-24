import { Injectable } from '@nestjs/common';
import { IActivityParser } from '../interfaces/activity-parser.interface';
import FitParser from 'fit-file-parser';
import { ParsedActivity } from '../dto/parsed-activity.dto';
import { toDate } from '../helpers/date.helper';
import {
  getSpeedStatsCapsForSport,
  maxSpeedFromTrackPoints,
  resolveActivityMaxSpeedMps,
  resolveFitAverageSpeedMps,
} from '../helpers/speed-stats.helper';
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
    const sessionRec = session as Record<string, unknown> | undefined;
    const totalTimerRaw =
      sessionRec?.['total_timer_time'] ?? sessionRec?.['totalTimerTime'];

    const parsedActivity: ParsedActivity = {
      sport: session?.sport ?? '',
      startTime: toDate(session?.start_time as string | Date | undefined),
      endTime: toDate(session?.timestamp as string | Date | undefined),
      durationSeconds: session?.total_elapsed_time ?? null,
      distanceMeters: session?.total_distance ?? null,
      elevationGainMeters: session?.total_ascent ?? null,
      elevationLossMeters: session?.total_descent ?? null,
      avgSpeed: null,
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

    const sportKey = String(session?.sport ?? '');
    parsedActivity.avgSpeed = resolveFitAverageSpeedMps({
      sportRaw: sportKey,
      totalDistanceMeters: parsedActivity.distanceMeters,
      totalTimerTimeSeconds:
        totalTimerRaw != null ? Number(totalTimerRaw) : null,
      totalElapsedTimeSeconds: parsedActivity.durationSeconds,
      sessionAvgSpeedMps: session?.avg_speed ?? null,
      trackPoints: parsedActivity.trackPoints,
    });
    const { segmentCapMps, sessionAbsCapMps } = getSpeedStatsCapsForSport(sportKey);
    const gpsMax = maxSpeedFromTrackPoints(parsedActivity.trackPoints, {
      maxSegmentSpeedMetersPerSecond: segmentCapMps,
    });
    parsedActivity.maxSpeed = resolveActivityMaxSpeedMps(
      parsedActivity.maxSpeed,
      gpsMax,
      sessionAbsCapMps,
    );

    return parsedActivity;
  }

  getSupportedExtensions(): string[] {
    return ['.fit'];
  }
}
