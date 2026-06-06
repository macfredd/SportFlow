import { Component, computed, inject, input } from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@ngneat/transloco';
import type { EChartsOption } from 'echarts';
import { NgxEchartsDirective } from 'ngx-echarts';
import { ECHARTS_ANIMATION_DURATION_MS } from '../../../../../../core/echarts/echarts.constants';
import { createTranslocoLangTick } from '../../../../../../core/i18n/create-transloco-lang-tick';
import { formatElapsedActivityTime } from '../../../../utils/activity-display.util';
import type { CadenceDistributionViewModel } from '../../../../utils/cadence-metrics.util';
import { cadenceZoneVisualMapPieces, formatCadenceZoneRangeLabel } from '../../../../utils/cadence-zones.constants';
import {
  CADENCE_CHART_AXIS_COLOR,
  CADENCE_CHART_AVG_LINE_COLOR,
  CADENCE_CHART_GRID_COLOR,
  CADENCE_DISTRIBUTION_HOVER_SYMBOL_SIZE,
  CADENCE_DISTRIBUTION_POINT_OPACITY,
  CADENCE_DISTRIBUTION_SYMBOL_SIZE,
} from '../../../../utils/cadence-metrics.constants';

@Component({
  selector: 'app-activity-cadence-distribution-chart',
  imports: [NgxEchartsDirective, TranslocoPipe],
  templateUrl: './activity-cadence-distribution-chart.html',
  styleUrl: './activity-cadence-distribution-chart.scss',
})
export class ActivityCadenceDistributionChart {
  private readonly transloco = inject(TranslocoService);

  readonly distribution = input<CadenceDistributionViewModel | null>(null);
  /** Time-weighted average (matches KPI row). */
  readonly avgCadence = input<number | null>(null);

  private readonly langTick = createTranslocoLangTick(this.transloco);

  readonly zoneRows = computed(() => {
    const model = this.distribution();
    if (!model) {
      return [];
    }
    return model.zones.map((zone) => ({
      zoneKey: zone.i18nKey,
      color: zone.color,
      rangeLabel: formatCadenceZoneRangeLabel(zone, model.unit),
    }));
  });

  readonly chartOptions = computed<EChartsOption | null>(() => {
    this.langTick();
    const model = this.distribution();
    if (!model || model.points.length === 0) {
      return null;
    }

    const transloco = this.transloco;
    const timeLabel = transloco.translate('activity.cadenceDistribution.axisTime');
    const unitLabel =
      model.unit === 'rpm'
        ? transloco.translate('activity.cadence.unitRpm')
        : transloco.translate('activity.cadence.unitSpm');
    const avgLabel = transloco.translate('activity.cadenceDistribution.avgLine');
    const avg = this.avgCadence() ?? model.avgCadence;
    const plotPoints = model.plotPoints;
    const binCount = model.binCount;
    const totalDurationSec = model.totalDurationSec > 0 ? model.totalDurationSec : 1;

    const scatterData = plotPoints.map((p) => [p.displayX, p.cadence]);

    const formatBinTime = (displayX: number): string => {
      const elapsedSec = (displayX / binCount) * totalDurationSec;
      return formatElapsedActivityTime(elapsedSec);
    };

    return {
      animationDuration: ECHARTS_ANIMATION_DURATION_MS,
      grid: {
        left: 8,
        right: 12,
        top: 28,
        bottom: 28,
        containLabel: true,
      },
      tooltip: {
        trigger: 'item',
        formatter: (params: unknown) => {
          const p = params as {
            dataIndex?: number;
            marker?: string;
          };
          const idx = p.dataIndex ?? -1;
          const point = plotPoints[idx];
          if (!point) {
            return '';
          }
          const zoneKey = model.zones[point.zoneIndex]?.i18nKey;
          const zoneName = zoneKey ? transloco.translate(zoneKey) : '';
          const timeStr = formatElapsedActivityTime(point.elapsedSec);
          const t = transloco;
          const lines = [
            `${t.translate('activity.cadenceDistribution.axisTime')}: ${timeStr}`,
            `${model.unit === 'rpm' ? t.translate('activity.cadence.unitRpm') : t.translate('activity.cadence.unitSpm')}: ${Math.round(point.cadence)}`,
          ];
          if (zoneName) {
            lines.push(zoneName);
          }
          return `${p.marker ?? ''}${lines.join('<br/>')}`;
        },
      },
      xAxis: {
        type: 'value',
        name: timeLabel,
        nameLocation: 'middle',
        nameGap: 22,
        min: 0,
        max: binCount,
        nameTextStyle: { color: CADENCE_CHART_AXIS_COLOR, fontSize: 11 },
        axisLabel: {
          color: CADENCE_CHART_AXIS_COLOR,
          fontSize: 10,
          formatter: (value: number) => formatBinTime(value),
        },
        splitLine: {
          lineStyle: { color: CADENCE_CHART_GRID_COLOR },
        },
      },
      yAxis: {
        type: 'value',
        name: unitLabel,
        min: model.yMin,
        max: model.yMax,
        nameTextStyle: { color: CADENCE_CHART_AXIS_COLOR, fontSize: 11 },
        axisLabel: {
          color: CADENCE_CHART_AXIS_COLOR,
          fontSize: 11,
        },
        splitLine: {
          lineStyle: { color: CADENCE_CHART_GRID_COLOR },
        },
      },
      visualMap: {
        type: 'piecewise',
        show: false,
        dimension: 1,
        pieces: cadenceZoneVisualMapPieces(model.zones),
      },
      series: [
        {
          type: 'scatter',
          symbolSize: CADENCE_DISTRIBUTION_SYMBOL_SIZE,
          itemStyle: {
            opacity: CADENCE_DISTRIBUTION_POINT_OPACITY,
            borderWidth: 0,
          },
          emphasis: {
            scale: false,
            symbolSize: CADENCE_DISTRIBUTION_HOVER_SYMBOL_SIZE,
            itemStyle: {
              opacity: 1,
              borderWidth: 0,
            },
          },
          data: scatterData,
          markLine: {
            silent: true,
            symbol: 'none',
            lineStyle: {
              type: 'dashed',
              color: CADENCE_CHART_AVG_LINE_COLOR,
              width: 1,
            },
            label: {
              formatter: `${avgLabel}: ${avg} ${unitLabel}`,
              color: CADENCE_CHART_AXIS_COLOR,
              fontSize: 10,
            },
            data: [{ yAxis: avg }],
          },
        },
      ],
    };
  });
}
