import { Component, computed, inject, input } from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@ngneat/transloco';
import type { EChartsOption } from 'echarts';
import { NgxEchartsDirective } from 'ngx-echarts';
import { createTranslocoLangTick } from '../../../../../../core/i18n/create-transloco-lang-tick';
import {
  HEART_RATE_ZONE_COLORS,
  HEART_RATE_ZONE_I18N_KEYS,
  HEART_RATE_ZONE_SHORT_LABELS,
} from '../../../../utils/heart-rate-zones.constants';
import {
  formatHeartRateZoneDuration,
  type HeartRateZonesViewModel,
} from '../../../../utils/heart-rate-zones.util';

@Component({
  selector: 'app-activity-heart-rate-by-time-chart',
  imports: [NgxEchartsDirective, TranslocoPipe],
  templateUrl: './activity-heart-rate-by-time-chart.html',
  styleUrl: './activity-heart-rate-by-time-chart.scss',
})
export class ActivityHeartRateByTimeChart {
  private readonly transloco = inject(TranslocoService);

  readonly zones = input<HeartRateZonesViewModel | null>(null);

  private readonly langTick = createTranslocoLangTick(this.transloco);

  readonly chartOptions = computed<EChartsOption | null>(() => {
    this.langTick();
    const m = this.zones();
    if (!m) {
      return null;
    }

    const transloco = this.transloco;
    const zoneSeconds = m.zoneSeconds;

    return {
      animationDuration: 200,
      grid: {
        left: 8,
        right: 48,
        top: 8,
        bottom: 8,
        containLabel: true,
      },
      tooltip: {
        trigger: 'item',
        formatter: (params: unknown) => {
          const p = params as { dataIndex?: number; value?: unknown; marker?: string };
          const idx = p.dataIndex ?? 0;
          const seconds =
            typeof p.value === 'number' ? p.value : Number(p.value ?? zoneSeconds[idx] ?? 0);
          if (!(seconds > 0)) {
            return '';
          }
          const title = transloco.translate(HEART_RATE_ZONE_I18N_KEYS[idx] ?? '');
          return `${p.marker ?? ''}${title}: ${formatHeartRateZoneDuration(seconds)}`;
        },
      },
      xAxis: {
        type: 'value',
        min: 0,
        axisLabel: {
          color: '#64748b',
          fontSize: 11,
          formatter: (value: number) => formatHeartRateZoneDuration(value),
        },
        splitLine: {
          lineStyle: {
            color: 'rgba(100, 116, 139, 0.18)',
          },
        },
      },
      yAxis: {
        type: 'category',
        inverse: true,
        data: [...HEART_RATE_ZONE_SHORT_LABELS],
        axisLabel: {
          color: '#0f172a',
          fontWeight: 600,
          fontSize: 12,
        },
        axisTick: { show: false },
        axisLine: { show: false },
      },
      series: [
        {
          type: 'bar',
          barWidth: '62%',
          data: zoneSeconds.map((seconds, i) => ({
            value: seconds,
            itemStyle: {
              color: HEART_RATE_ZONE_COLORS[i],
              borderRadius: [0, 4, 4, 0],
            },
          })),
          label: {
            show: true,
            position: 'right',
            formatter: (params: unknown) => {
              const p = params as { value?: unknown };
              const seconds = typeof p.value === 'number' ? p.value : Number(p.value);
              return seconds > 0 ? formatHeartRateZoneDuration(seconds) : '';
            },
            color: '#0f172a',
            fontSize: 11,
            fontWeight: 600,
          },
          emphasis: { focus: 'series' },
        },
      ],
    };
  });
}
