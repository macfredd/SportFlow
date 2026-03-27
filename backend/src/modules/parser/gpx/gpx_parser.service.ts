import { BadRequestException, Injectable } from '@nestjs/common';
import { XMLParser } from 'fast-xml-parser';
import { ParsedActivity } from '../dto/parsed-activity.dto';
import { ParsedTrackPoint } from '../dto/parsed-track-point.dto';
import { IActivityParser } from '../interfaces/activity-parser.interface';
import { asArray, xmlTextContent } from '../helpers/xml.helper';
import { mapGpxTrkptToParsedTrackPoint } from './gpx-trkpt.mapper';

@Injectable()
export class GpxParserService implements IActivityParser {
  async parse(buffer: Buffer): Promise<ParsedActivity> {
    const xmlParser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      trimValues: true,
      textNodeName: 'value',
      ignoreDeclaration: true,
      ignorePiTags: true,
      parseAttributeValue: false,
      parseTagValue: true,
    });

    const root = xmlParser.parse(buffer.toString('utf-8')) as Record<
      string,
      unknown
    >;
    const gpxDoc = root.gpx;

    if (gpxDoc == null || typeof gpxDoc !== 'object') {
      throw new BadRequestException(
        'GPX file is invalid: missing root <gpx> element.',
      );
    }

    const doc = gpxDoc as Record<string, unknown>;
    const tracks = asArray(doc.trk);

    if (tracks.length === 0) {
      throw new BadRequestException('GPX file is invalid: no <trk> element.');
    }

    const parsedTrackPoints: ParsedTrackPoint[] = [];

    for (const trk of tracks) {
      if (trk == null || typeof trk !== 'object') continue;
      const trkObj = trk as Record<string, unknown>;
      const segments = asArray(trkObj.trkseg);
      for (const seg of segments) {
        if (seg == null || typeof seg !== 'object') continue;
        const segObj = seg as Record<string, unknown>;
        const points = asArray(segObj.trkpt);
        for (const pt of points) {
          if (pt == null || typeof pt !== 'object') continue;
          const mapped = mapGpxTrkptToParsedTrackPoint(
            pt as Record<string, unknown>,
          );
          if (mapped) parsedTrackPoints.push(mapped);
        }
      }
    }

    if (parsedTrackPoints.length === 0) {
      throw new BadRequestException(
        'GPX file has no valid <trkpt> entries (time + coordinates where expected).',
      );
    }

    const firstTrk = tracks[0] as Record<string, unknown>;
    const sport = xmlTextContent(firstTrk.type) ?? '';

    const startTime = parsedTrackPoints[0].timestamp;
    const endTime = parsedTrackPoints[parsedTrackPoints.length - 1].timestamp;

    const parsedActivity: ParsedActivity = {
      sport,
      startTime,
      endTime,
      durationSeconds: null,
      distanceMeters: null,
      elevationGainMeters: null,
      elevationLossMeters: null,
      avgSpeed: null,
      maxSpeed: null,
      avgHeartRate: null,
      maxHeartRate: null,
      totalCalories: null,
      fileSourceType: 'GPX',
      trackPoints: parsedTrackPoints,
    };

    return parsedActivity;
  }

  getSupportedExtensions(): string[] {
    return ['.gpx'];
  }
}
