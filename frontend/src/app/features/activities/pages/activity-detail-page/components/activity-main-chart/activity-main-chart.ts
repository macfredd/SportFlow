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

function formatXAxisTickInteger(value: number, unit: 'km' | 'mi'): string {
  const whole = Math.round(value);
  if (value < 0 || Math.abs(value - whole) > 0.02) {
    return '';
  }
  return `${whole} ${unit}`;
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
  const padTop = Math.max(span * 0.32, 45);
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
          axisLabel: {
            formatter: (v: number) => formatXAxisTickInteger(v, distUnit),
          },
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

    const distDigits = 2;

    return {
      grid: { left: 48, right: 16, top: 16, bottom: 40, containLabel: true },
      xAxis: {
        type: 'value',
        name: distanceAxisName(distUnit),
        min: 0,
        max: xMax,
        interval: 1,
        scale: false,
        axisLabel: {
          formatter: (v: number) => formatXAxisTickInteger(v, distUnit),
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
