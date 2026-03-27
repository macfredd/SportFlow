import { ParsedTrackPoint } from '../dto/parsed-track-point.dto';
import { xmlTextContent } from '../helpers/xml.helper';

/** Node shape from fast-xml-parser (attributes with `attributeNamePrefix`). */
type GpxTrkptNode = Record<string, unknown>;

function optionalNumber(value: unknown): number | null {
  if (value == null || value === '') return null;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

function optionalInt(value: unknown): number | null {
  const n = optionalNumber(value);
  if (n == null) return null;
  return Math.round(n);
}

function readHeartRateAndCadence(extensions: unknown): {
  hr: number | null;
  cad: number | null;
} {
  if (extensions == null || typeof extensions !== 'object') {
    return { hr: null, cad: null };
  }
  const ext = extensions as Record<string, unknown>;
  const tpe =
    ext['gpxtpx:TrackPointExtension'] ??
    ext['TrackPointExtension'] ??
    ext.trackpointextension;
  if (tpe == null || typeof tpe !== 'object') {
    return { hr: null, cad: null };
  }
  const block = tpe as Record<string, unknown>;
  return {
    hr: optionalInt(block['gpxtpx:hr'] ?? block.hr),
    cad: optionalInt(block['gpxtpx:cad'] ?? block.cad),
  };
}

export function mapGpxTrkptToParsedTrackPoint(
  trkpt: GpxTrkptNode,
): ParsedTrackPoint | null {
  const timeStr = xmlTextContent(trkpt.time);
  if (!timeStr) return null;

  const timestamp = new Date(timeStr);
  if (Number.isNaN(timestamp.getTime())) return null;

  const latRaw = trkpt['@_lat'];
  const lonRaw = trkpt['@_lon'];
  const lat = optionalNumber(latRaw);
  const lon = optionalNumber(lonRaw);
  const hasGps = lat != null && lon != null;

  const altitude = optionalNumber(trkpt.ele);

  const { hr, cad } = readHeartRateAndCadence(trkpt.extensions);

  return {
    timestamp,
    latitude: hasGps ? lat : null,
    longitude: hasGps ? lon : null,
    altitude,
    speed: null,
    heartRate: hr,
    cadence: cad,
    elapsedTimeSeconds: null,
  };
}
