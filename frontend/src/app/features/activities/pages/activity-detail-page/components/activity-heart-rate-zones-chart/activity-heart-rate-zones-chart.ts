import { Component, computed, inject, input } from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@ngneat/transloco';
import type { EChartsOption } from 'echarts';
import { NgxEchartsDirective } from 'ngx-echarts';
import { ECHARTS_ANIMATION_DURATION_MS } from '../../../../../../core/echarts/echarts.constants';
import { createTranslocoLangTick } from '../../../../../../core/i18n/create-transloco-lang-tick';
import {
  HEART_RATE_ZONE_COLORS,
  HEART_RATE_ZONE_I18N_KEYS,
  HEART_RATE_ZONE_SHORT_LABELS,
  type HeartRateZoneI18nKey,
} from '../../../../utils/heart-rate-zones.constants';
import {
  DEFAULT_ESTIMATED_MAX_HR_BPM,
  type HeartRateZonesViewModel,
} from '../../../../utils/heart-rate-zones.util';

const STACK_ID = 'zones';

/** Solo mostramos etiqueta en el segmento si hay más del 10 %. */
const MIN_PERCENT_FOR_IN_BAR_LABEL = 10;

function inBarLabelColor(zoneIndex: number): string {
  if (zoneIndex === 2) {
    return 'rgba(15, 23, 42, 0.92)';
  }
  return 'rgba(255, 255, 255, 0.96)';
}

function borderRadiusForStackedSegment(
  percents: readonly number[],
  index: number,
): number | [number, number, number, number] {
  const firstIdx = percents.findIndex((v) => v > 0);
  let lastIdx = -1;
  for (let i = percents.length - 1; i >= 0; i--) {
    if (percents[i] > 0) {
      lastIdx = i;
      break;
    }
  }
  if (percents[index] <= 0 || firstIdx < 0 || lastIdx < 0) {
    return 0;
  }
  if (firstIdx === lastIdx) {
    return 8;
  }
  if (index === firstIdx) {
    return [8, 0, 0, 8];
  }
  if (index === lastIdx) {
    return [0, 8, 8, 0];
  }
  return 0;
}

type HeartRateZoneRow = {
  readonly zoneKey: HeartRateZoneI18nKey;
  readonly percent: number;
  readonly color: string;
};

@Component({
  selector: 'app-activity-heart-rate-zones-chart',
  imports: [NgxEchartsDirective, TranslocoPipe],
  templateUrl: './activity-heart-rate-zones-chart.html',
  styleUrl: './activity-heart-rate-zones-chart.scss',
})
export class ActivityHeartRateZonesChart {
  private readonly transloco = inject(TranslocoService);

  readonly zones = input<HeartRateZonesViewModel | null>(null);

  /** Exposed for i18n `precisionNote` param (must match `DEFAULT_ESTIMATED_MAX_HR_BPM`). */
  readonly defaultMaxBpm = DEFAULT_ESTIMATED_MAX_HR_BPM;

  private readonly langTick = createTranslocoLangTick(this.transloco);

  /** Leyenda: claves i18n; el texto sale del pipe (reactivo al idioma). */
  readonly zoneRows = computed<readonly HeartRateZoneRow[]>(() => {
    const m = this.zones();
    if (!m) {
      return [];
    }
    return HEART_RATE_ZONE_I18N_KEYS.map((key, i) => ({
      zoneKey: key,
      percent: m.zonePercents[i],
      color: HEART_RATE_ZONE_COLORS[i],
    }));
  });

  readonly chartOptions = computed<EChartsOption | null>(() => {
    this.langTick();
    const m = this.zones();
    if (!m) {
      return null;
    }
    const transloco = this.transloco;
    const percents = m.zonePercents;

    const series = HEART_RATE_ZONE_I18N_KEYS.map((key, i) => {
      const showInBarLabel = percents[i] > MIN_PERCENT_FOR_IN_BAR_LABEL;
      return {
        /** Clave i18n (no texto traducido): el tooltip traduce al vuelo y evita keys “pegadas” tras merge/cambio de idioma. */
        name: key,
        type: 'bar' as const,
        stack: STACK_ID,
        barCategoryGap: '0%',
        barGap: '0%',
        itemStyle: {
          color: HEART_RATE_ZONE_COLORS[i],
          borderRadius: borderRadiusForStackedSegment(percents, i),
        },
        label: {
          show: showInBarLabel,
          position: 'inside' as const,
          formatter: HEART_RATE_ZONE_SHORT_LABELS[i],
          fontSize: 12,
          fontWeight: 600,
          color: inBarLabelColor(i),
        },
        emphasis: { focus: 'series' as const },
        data: [percents[i]],
      };
    });

    return {
      animationDuration: ECHARTS_ANIMATION_DURATION_MS,
      grid: {
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        containLabel: false,
      },
      tooltip: {
        trigger: 'item',
        formatter: (params: unknown) => {
          const p = params as { value?: unknown; marker?: string; seriesName?: string };
          const v = typeof p.value === 'number' ? p.value : Number(p.value);
          if (!(v > 0)) {
            return '';
          }
          const title = transloco.translate(p.seriesName ?? '');
          return `${p.marker ?? ''}${title}: ${v}%`;
        },
      },
      xAxis: {
        type: 'value',
        max: 100,
        show: false,
      },
      yAxis: {
        type: 'category',
        data: [''],
        show: false,
      },
      series,
    };
  });
}
