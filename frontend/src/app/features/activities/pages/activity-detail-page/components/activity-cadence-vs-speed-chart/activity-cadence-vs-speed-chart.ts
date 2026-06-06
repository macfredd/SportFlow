import { Component, computed, inject, input } from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@ngneat/transloco';
import type { EChartsOption } from 'echarts';
import { NgxEchartsDirective } from 'ngx-echarts';
import { ECHARTS_ANIMATION_DURATION_MS } from '../../../../../../core/echarts/echarts.constants';
import {
  CADENCE_HEATMAP_TOOLTIP_STYLE,
  containedTooltipPosition,
  formatEchartsTooltipTable,
} from '../../../../../../core/echarts/echarts-tooltip.util';
import { createTranslocoLangTick } from '../../../../../../core/i18n/create-transloco-lang-tick';
import { formatElapsedActivityTime } from '../../../../utils/activity-display.util';
import {
  CADENCE_CHART_AXIS_COLOR,
  CADENCE_CHART_GRID_COLOR,
  CADENCE_HEATMAP_AXIS_BOUNDARY_GAP,
  CADENCE_HEATMAP_FREQUENCY_COLORS,
} from '../../../../utils/cadence-metrics.constants';
import type { CadenceSpeedHeatmapViewModel } from '../../../../utils/cadence-speed-heatmap.util';
import { formatCadenceBinRangeLabel } from '../../../../utils/cadence-speed-heatmap.util';

/** Claves i18n: el tooltip traduce al vuelo (evita keys pegadas tras merge/cambio de idioma). */
const CADENCE_VS_SPEED_TOOLTIP_I18N = {
  cadence: 'activity.cadenceVsSpeed.tooltipCadence',
  speed: 'activity.cadenceVsSpeed.tooltipSpeed',
  samples: 'activity.cadenceVsSpeed.tooltipSamples',
  time: 'activity.cadenceVsSpeed.tooltipTime',
  percentSamples: 'activity.cadenceVsSpeed.tooltipPercentSamples',
  percentTime: 'activity.cadenceVsSpeed.tooltipPercentTime',
} as const;

@Component({
  selector: 'app-activity-cadence-vs-speed-chart',
  imports: [NgxEchartsDirective, TranslocoPipe],
  templateUrl: './activity-cadence-vs-speed-chart.html',
  styleUrl: './activity-cadence-vs-speed-chart.scss',
})
export class ActivityCadenceVsSpeedChart {
  private readonly transloco = inject(TranslocoService);

  readonly heatmap = input<CadenceSpeedHeatmapViewModel | null>(null);

  private readonly langTick = createTranslocoLangTick(this.transloco);

  /** Re-mount ECharts when language bundle reloads (axis / visualMap labels). */
  readonly chartLangKey = computed(() => this.langTick());

  readonly frequencyLegendColors = [...CADENCE_HEATMAP_FREQUENCY_COLORS];

  readonly chartOptions = computed<EChartsOption | null>(() => {
    this.langTick();
    const model = this.heatmap();
    if (!model || model.data.length === 0) {
      return null;
    }

    const transloco = this.transloco;
    const unitLabel =
      model.unit === 'rpm'
        ? transloco.translate('activity.cadence.unitRpm')
        : transloco.translate('activity.cadence.unitSpm');
    const speedAxis = transloco.translate('activity.cadenceVsSpeed.axisSpeed');
    const cadenceAxis = transloco.translate('activity.cadenceVsSpeed.axisCadence');

    const labelStride = Math.max(1, Math.ceil(model.speedBinLabels.length / 10));

    return {
      animationDuration: ECHARTS_ANIMATION_DURATION_MS,
      grid: {
        left: 12,
        right: 56,
        top: 16,
        bottom: 50,
        containLabel: true,
      },
      tooltip: {
        ...CADENCE_HEATMAP_TOOLTIP_STYLE,
        position: containedTooltipPosition,
        formatter: (params: unknown) => {
          const p = params as { data?: [number, number, number] };
          const tuple = p.data;
          if (!tuple) {
            return '';
          }
          const [x, y] = tuple;
          const meta = model.cellMeta.get(`${x},${y}`);
          if (!meta) {
            return '';
          }
          const cadenceRange = formatCadenceBinRangeLabel(
            meta.cadenceMin,
            model.cadenceBucket,
            model.unit,
          );
          const speedRange = `${meta.speedMin.toFixed(2)}–${meta.speedMax.toFixed(2)} m/s`;
          const timeStr = formatElapsedActivityTime(meta.timeSec);
          const t = transloco;
          const keys = CADENCE_VS_SPEED_TOOLTIP_I18N;
          return formatEchartsTooltipTable([
            { label: t.translate(keys.cadence), value: cadenceRange },
            { label: t.translate(keys.speed), value: speedRange },
            { label: t.translate(keys.samples), value: String(meta.count) },
            { label: t.translate(keys.time), value: timeStr },
            {
              label: t.translate(keys.percentSamples),
              value: `${meta.percentOfSamples.toFixed(1)}%`,
              separatorBefore: true,
            },
            {
              label: t.translate(keys.percentTime),
              value: `${meta.percentOfTime.toFixed(1)}%`,
            },
          ]);
        },
      },
      xAxis: {
        type: 'category',
        zlevel: 2,
        name: speedAxis,
        nameLocation: 'middle',
        nameGap: 28,
        boundaryGap: CADENCE_HEATMAP_AXIS_BOUNDARY_GAP,
        data: [...model.speedBinLabels],
        splitArea: { show: false },
        axisLine: {
          show: true,
          lineStyle: { color: CADENCE_CHART_AXIS_COLOR, width: 1 },
        },
        axisTick: { show: true, alignWithLabel: true },
        nameTextStyle: { color: CADENCE_CHART_AXIS_COLOR, fontSize: 11 },
        axisLabel: {
          color: CADENCE_CHART_AXIS_COLOR,
          fontSize: 9,
          interval: labelStride - 1,
          hideOverlap: true,
          rotate: 0,
          formatter: (value: string) => value.split(' ')[0],
        },
        splitLine: {
          lineStyle: { color: CADENCE_CHART_GRID_COLOR },
        },
      },
      yAxis: {
        type: 'category',
        zlevel: 2,
        name: `${cadenceAxis} (${unitLabel})`,
        boundaryGap: CADENCE_HEATMAP_AXIS_BOUNDARY_GAP,
        data: [...model.cadenceBinLabels],
        axisLine: {
          show: true,
          lineStyle: { color: CADENCE_CHART_AXIS_COLOR, width: 1 },
        },
        axisTick: { show: true, alignWithLabel: true },
        nameTextStyle: { color: CADENCE_CHART_AXIS_COLOR, fontSize: 11 },
        axisLabel: {
          color: CADENCE_CHART_AXIS_COLOR,
          fontSize: 9,
        },
        splitLine: {
          lineStyle: { color: CADENCE_CHART_GRID_COLOR },
        },
      },
      visualMap: {
        min: 0,
        max: model.maxCount,
        calculable: false,
        orient: 'vertical',
        right: 4,
        top: 'center',
        itemHeight: 72,
        itemWidth: 10,
        text: [
          transloco.translate('activity.cadenceVsSpeed.frequencyHigh'),
          transloco.translate('activity.cadenceVsSpeed.frequencyLow'),
        ],
        textStyle: {
          color: CADENCE_CHART_AXIS_COLOR,
          fontSize: 9,
        },
        inRange: {
          color: [...CADENCE_HEATMAP_FREQUENCY_COLORS],
        },
      },
      series: [
        {
          type: 'heatmap',
          zlevel: 1,
          data: [...model.data],
          emphasis: {
            itemStyle: {
              shadowBlur: 6,
              shadowColor: 'rgba(0, 0, 0, 0.15)',
            },
          },
          itemStyle: {
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.65)',
          },
        },
      ],
    };
  });
}
