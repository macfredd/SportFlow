import { Component, computed, inject, input } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  TranslocoPipe,
  TranslocoService,
  type TranslocoEvents,
} from '@ngneat/transloco';
import type { EChartsOption } from 'echarts';
import { NgxEchartsDirective } from 'ngx-echarts';
import { merge } from 'rxjs';
import { filter, map, startWith } from 'rxjs/operators';

import type { ActivitySplitsViewModel } from '../../../../utils/activity-splits.util';

const HR_LINE_COLOR = '#dc2626';

@Component({
  selector: 'app-activity-heart-rate-by-split-chart',
  imports: [NgxEchartsDirective, TranslocoPipe],
  templateUrl: './activity-heart-rate-by-split-chart.html',
  styleUrl: './activity-heart-rate-by-split-chart.scss',
})
export class ActivityHeartRateBySplitChart {
  private readonly transloco = inject(TranslocoService);

  readonly splits = input<ActivitySplitsViewModel | null>(null);

  readonly hasHeartRateData = computed(() =>
    (this.splits()?.rows ?? []).some((row) => row.avgHeartRate !== null),
  );

  private readonly i18nTick = toSignal(
    merge(
      this.transloco.langChanges$,
      this.transloco.events$.pipe(
        filter(
          (e: TranslocoEvents) => e.type === 'translationLoadSuccess' && !e.wasFailure,
        ),
      ),
    ).pipe(
      map(() => this.transloco.getActiveLang()),
      startWith(this.transloco.getActiveLang()),
    ),
    { initialValue: this.transloco.getActiveLang() },
  );

  readonly chartOptions = computed<EChartsOption | null>(() => {
    this.i18nTick();
    const model = this.splits();
    const rows = model?.rows ?? [];
    if (rows.length === 0 || !rows.some((row) => row.avgHeartRate !== null)) {
      return null;
    }

    const transloco = this.transloco;
    const splitLabel = transloco.translate('activity.heartRateBySplit.tooltipSplit');
    const bpmLabel = transloco.translate('activity.heartRateBySplit.axisBpm');

    const categories = rows.map((row) => String(row.index));
    const seriesData = rows.map((row) => row.avgHeartRate);

    const hrValues = seriesData.filter((v): v is number => v !== null);
    const minHr = Math.min(...hrValues);
    const maxHr = Math.max(...hrValues);
    const yPadding = 5;

    return {
      animationDuration: 200,
      grid: {
        left: 12,
        right: 16,
        top: 24,
        bottom: 8,
        containLabel: true,
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'line' },
        formatter: (params: unknown) => {
          const items = Array.isArray(params) ? params : [params];
          const first = items[0] as { dataIndex?: number; value?: unknown; marker?: string };
          const idx = first?.dataIndex ?? 0;
          const hr = first?.value;
          if (hr == null || hr === '' || Number.isNaN(Number(hr))) {
            return '';
          }
          return `${first.marker ?? ''}${splitLabel} ${categories[idx]}: ${hr} ${bpmLabel}`;
        },
      },
      xAxis: {
        type: 'category',
        name: transloco.translate('activity.heartRateBySplit.axisSplit'),
        nameLocation: 'middle',
        nameGap: 28,
        nameTextStyle: {
          color: '#64748b',
          fontSize: 11,
        },
        data: categories,
        axisLabel: {
          color: '#64748b',
          fontSize: 11,
        },
        axisLine: {
          lineStyle: { color: 'rgba(100, 116, 139, 0.35)' },
        },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        name: bpmLabel,
        min: Math.max(0, Math.floor(minHr - yPadding)),
        max: Math.ceil(maxHr + yPadding),
        axisLabel: {
          color: '#64748b',
          fontSize: 11,
        },
        splitLine: {
          lineStyle: {
            color: 'rgba(100, 116, 139, 0.18)',
          },
        },
      },
      series: [
        {
          type: 'line',
          smooth: 0.25,
          symbol: 'circle',
          symbolSize: 7,
          connectNulls: false,
          lineStyle: {
            color: HR_LINE_COLOR,
            width: 2,
          },
          itemStyle: {
            color: HR_LINE_COLOR,
            borderColor: '#ffffff',
            borderWidth: 2,
          },
          emphasis: {
            focus: 'series',
            itemStyle: {
              borderWidth: 2,
              shadowBlur: 6,
              shadowColor: 'rgba(220, 38, 38, 0.35)',
            },
          },
          data: seriesData,
        },
      ],
    };
  });
}
