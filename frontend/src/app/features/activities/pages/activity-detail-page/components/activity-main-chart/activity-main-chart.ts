import { Component, computed, input } from '@angular/core';
import { NgxEchartsDirective } from 'ngx-echarts';
import type { EChartsOption } from 'echarts';

import type { TrackPointChartPublicDto } from '../../../../../../shared/models/activity.model';

const METERS_TO_KM = 0.001;
const METERS_TO_MI = 0.000621371192314;

function metersToAxisDistance(meters: number, unit: 'km' | 'mi'): number {
  return unit === 'km' ? meters * METERS_TO_KM : meters * METERS_TO_MI;
}

function distanceAxisName(unit: 'km' | 'mi'): string {
  return unit === 'km' ? 'Distance (km)' : 'Distance (mi)';
}

const X_TICK_COUNT_MIN = 8;
const X_TICK_COUNT_MAX = 12;
const X_TICK_TARGET_ORDER = [10, 9, 11, 8, 12] as const;

/** 1–2–2.5–5–10 style step (same axis as typical chart libs). */
function niceStep(rough: number): number {
  if (!Number.isFinite(rough) || rough <= 0) {
    return 0.1;
  }
  const exp = Math.floor(Math.log10(rough));
  const base = 10 ** exp;
  const m = rough / base;
  let niceM: number;
  if (m <= 1) {
    niceM = 1;
  } else if (m <= 2) {
    niceM = 2;
  } else if (m <= 2.5) {
    niceM = 2.5;
  } else if (m <= 5) {
    niceM = 5;
  } else {
    niceM = 10;
  }
  return niceM * base;
}

/**
 * Step and last tick so labels are step, 2*step, … maxTick (never the raw end if not on grid).
 * Prefers ~10 divisions in [8, 12].
 */
function computeXAxisStep(lengthDisplay: number): { step: number; maxTick: number } {
  const L = lengthDisplay;
  const EPS = 1e-7;
  if (L <= EPS) {
    return { step: 1, maxTick: 0 };
  }

  let best: { step: number; count: number; score: number } | null = null;
  for (const target of X_TICK_TARGET_ORDER) {
    const step = niceStep(L / target);
    const count = Math.floor(L / step + EPS);
    if (count < X_TICK_COUNT_MIN || count > X_TICK_COUNT_MAX) {
      continue;
    }
    const score = Math.abs(count - 10);
    if (
      !best ||
      score < best.score ||
      (score === best.score && Math.abs(step - L / 10) < Math.abs(best.step - L / 10))
    ) {
      best = { step, count, score };
    }
  }

  if (best) {
    const maxTick = best.count * best.step;
    return { step: best.step, maxTick };
  }

  /** Fallback: ~10 divisions with 3-decimal step (e.g. 0.33). */
  let step = Math.round((L / 10) * 1000) / 1000;
  if (step <= 0) {
    step = L;
  }
  let count = Math.floor(L / step + EPS);
  if (count > X_TICK_COUNT_MAX) {
    step = Math.round((L / X_TICK_COUNT_MAX) * 1000) / 1000;
    if (step <= 0) step = L / X_TICK_COUNT_MAX;
    count = Math.floor(L / step + EPS);
  }
  if (count < X_TICK_COUNT_MIN) {
    step = Math.round((L / X_TICK_COUNT_MIN) * 1000) / 1000;
    if (step <= 0) step = L / X_TICK_COUNT_MIN;
    count = Math.floor(L / step + EPS);
  }
  const maxTick = count * step;
  return { step, maxTick };
}

function isOnStepGrid(value: number, step: number): boolean {
  if (step <= 0) {
    return false;
  }
  const k = value / step;
  return Math.abs(k - Math.round(k)) < 1e-4;
}

function decimalsForStep(step: number): number {
  if (step >= 1 - 1e-9) {
    return 0;
  }
  const t = step.toFixed(6).replace(/\.?0+$/, '');
  const dot = t.indexOf('.');
  return dot === -1 ? 0 : Math.min(2, t.length - dot - 1);
}

function formatXDistanceTickLabel(value: number, unit: 'km' | 'mi', step: number): string {
  const d = decimalsForStep(step);
  const n = d === 0 ? Math.round(value) : Number(value.toFixed(d));
  return `${n} ${unit}`;
}

function formatYAxisTick(value: number): string {
  return `${Math.round(value)} m`;
}

/** Rolling average on elevation only; keeps distance (x) unchanged. Reduces GPS spikes. */
function smoothElevationProfile(pairs: [number, number][], radius: number): [number, number][] {
  if (pairs.length === 0 || radius < 1) {
    return pairs;
  }
  return pairs.map((pair, i) => {
    let sum = 0;
    let n = 0;
    for (let j = Math.max(0, i - radius); j <= Math.min(pairs.length - 1, i + radius); j++) {
      sum += pairs[j][1];
      n++;
    }
    return [pair[0], Math.round((sum / n) * 10) / 10];
  });
}

/** Vertical scale: padding below / above, then round to 10 m ticks. */
function elevationAxisExtent(minAlt: number, maxAlt: number): { min: number; max: number } {
  const span = Math.max(maxAlt - minAlt, 1);
  const padBottom = Math.max(span * 0.14, 12);
  const padTop = Math.max(span * 0.5, 125);
  let yMin = minAlt - padBottom;
  let yMax = maxAlt + padTop;
  yMin = Math.floor(yMin / 10) * 10;
  yMax = Math.ceil(yMax / 10) * 10;
  if (yMax <= yMin) {
    yMax = yMin + 50;
  }
  return { min: yMin, max: yMax };
}

@Component({
  selector: 'app-activity-main-chart',
  imports: [NgxEchartsDirective],
  templateUrl: './activity-main-chart.html',
  styleUrl: './activity-main-chart.scss',
})
export class ActivityMainChart {
  readonly chartData = input<TrackPointChartPublicDto | null>(null);

  readonly chartOption = computed<EChartsOption>(() => {
    const payload = this.chartData();
    const points = payload?.track_points ?? [];

    const pairs = points
      .filter((p) => p.altitude_meters !== null)
      .map((p) => [p.accumulated_distance_meters, p.altitude_meters as number] as [number, number]);

    const distUnit = payload?.preferred_distance_unit ?? 'km';

    if (pairs.length === 0) {
      return {
        grid: { left: 48, right: 16, top: 16, bottom: 40, containLabel: true },
        xAxis: {
          type: 'value',
          name: distanceAxisName(distUnit),
        },
        yAxis: {
          type: 'value',
          name: 'Elevation (m)',
          axisLabel: {
            formatter: (v: number) => formatYAxisTick(v),
          },
        },
        series: [],
      } satisfies EChartsOption;
    }

    const plotPairsM = smoothElevationProfile(pairs, 2);
    const plotPairs = plotPairsM.map(
      ([xm, y]) => [metersToAxisDistance(xm, distUnit), y] as [number, number],
    );

    const ys = plotPairs.map((p) => p[1]);
    const minAlt = Math.min(...ys);
    const maxAlt = Math.max(...ys);
    const yExtent = elevationAxisExtent(minAlt, maxAlt);

    const maxDistM = Math.max(...plotPairsM.map((p) => p[0]));
    /** Exact activity distance in display units (no extra padding). */
    const xMax = metersToAxisDistance(maxDistM, distUnit);

    const { step: xStep, maxTick: xMaxTick } = computeXAxisStep(xMax);

    const distDigits = 2;

    return {
      grid: { left: 48, right: 16, top: 16, bottom: 40, containLabel: true },
      xAxis: {
        type: 'value',
        name: distanceAxisName(distUnit),
        min: 0,
        max: xMax,
        interval: xStep,
        scale: false,
        axisLabel: {
          formatter: (v: number) => {
            if (v <= 0) {
              return '';
            }
            if (v > xMaxTick + 1e-5) {
              return '';
            }
            if (!isOnStepGrid(v, xStep)) {
              return '';
            }
            return formatXDistanceTickLabel(v, distUnit, xStep);
          },
        },
      },
      yAxis: {
        type: 'value',
        name: 'Elevation (m)',
        min: yExtent.min,
        max: yExtent.max,
        scale: false,
        axisLabel: {
          formatter: (v: number) => formatYAxisTick(v),
        },
      },
      series: [
        {
          type: 'line',
          smooth: 0.55,
          showSymbol: false,
          areaStyle: {
            color: 'rgba(148, 163, 184, 0.35)',
          },
          lineStyle: { color: '#64748b', width: 1 },
          data: plotPairs,
        },
      ],
      tooltip: {
        trigger: 'axis',
        formatter: (params: unknown) => {
          const list = Array.isArray(params) ? params : [params];
          const first = list[0] as { value?: [number, number] };
          const val = first?.value;
          if (!val || !Array.isArray(val)) {
            return '';
          }
          const [dist, alt] = val;
          const u = distUnit === 'km' ? 'km' : 'mi';
          return `${dist.toFixed(distDigits)} ${u}<br/>${alt} m`;
        },
      },
    } satisfies EChartsOption;
  });
}
