import { Component, computed, inject, input } from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@ngneat/transloco';
import type { EChartsOption } from 'echarts';
import { NgxEchartsDirective } from 'ngx-echarts';
import { ECHARTS_ANIMATION_DURATION_MS } from '@core/echarts/echarts.constants';
import {
  CADENCE_HEATMAP_TOOLTIP_STYLE,
  containedTooltipPosition,
  formatEchartsTooltipTable,
} from '@core/echarts/echarts-tooltip.util';
import { createTranslocoLangTick } from '@core/i18n/create-transloco-lang-tick';
import { formatElapsedActivityTime } from '@features/activities/utils/activity-display.util';
import type { CadenceHrDriftHeatmapViewModel } from '@features/activities/utils/cadence-hr-drift-heatmap.util';
import {
  CADENCE_CHART_AXIS_COLOR,
  CADENCE_CHART_GRID_COLOR,
  CADENCE_HEATMAP_AXIS_BOUNDARY_GAP,
  CADENCE_HR_DRIFT_COLORS,
} from '@features/activities/utils/cadence-metrics.constants';
import { formatCadenceBinRangeLabel } from '@features/activities/utils/cadence-speed-heatmap.util';

const TOOLTIP_I18N = {
  time: 'activity.cadenceHrDrift.tooltipTime',
  cadence: 'activity.cadenceHrDrift.tooltipCadence',
  heartRate: 'activity.cadenceHrDrift.tooltipHeartRate',
  samples: 'activity.cadenceHrDrift.tooltipSamples',
} as const;

@Component({
  selector: 'app-activity-cadence-hr-drift-chart',
  imports: [NgxEchartsDirective, TranslocoPipe],
  templateUrl: './activity-cadence-hr-drift-chart.html',
  styleUrl: './activity-cadence-hr-drift-chart.scss',
})
export class ActivityCadenceHrDriftChart {
  private readonly transloco = inject(TranslocoService);

  readonly heatmap = input<CadenceHrDriftHeatmapViewModel | null>(null);

  private readonly langTick = createTranslocoLangTick(this.transloco);

  readonly chartLangKey = computed(() => this.langTick());

  readonly hrLegendColors = [...CADENCE_HR_DRIFT_COLORS];

  readonly chartOptions = computed<EChartsOption | null>(() => {
    this.langTick();
    const model = this.heatmap();
    if (!model || model.data.length === 0) {
      return null;
    }

    const transloco = this.transloco;
    const timeAxis = transloco.translate('activity.cadenceHrDrift.axisTime');
    const cadenceAxis = transloco.translate('activity.cadenceHrDrift.axisCadence');
    const unitLabel =
      model.unit === 'rpm'
        ? transloco.translate('activity.cadence.unitRpm')
        : transloco.translate('activity.cadence.unitSpm');

    const timeLabelStride = Math.max(1, Math.ceil(model.timeBinCount / 8));

    return {
      animationDuration: ECHARTS_ANIMATION_DURATION_MS,
      grid: {
        left: 12,
        right: 52,
        top: 16,
        bottom: 8,
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
          const [x, y, avgHr] = tuple;
          const meta = model.cellMeta.get(`${x},${y}`);
          if (!meta) {
            return '';
          }
          const t = transloco;
          const keys = TOOLTIP_I18N;
          const timeRange = `${formatElapsedActivityTime(meta.elapsedStartSec)}–${formatElapsedActivityTime(meta.elapsedEndSec)}`;
          return formatEchartsTooltipTable([
            { label: t.translate(keys.time), value: timeRange },
            {
              label: t.translate(keys.cadence),
              value: formatCadenceBinRangeLabel(meta.cadenceMin, model.cadenceBucket, model.unit),
            },
            { label: t.translate(keys.heartRate), value: `${avgHr} bpm` },
            { label: t.translate(keys.samples), value: String(meta.count) },
          ]);
        },
      },
      xAxis: {
        type: 'category',
        zlevel: 2,
        name: timeAxis,
        nameLocation: 'middle',
        nameGap: 26,
        boundaryGap: CADENCE_HEATMAP_AXIS_BOUNDARY_GAP,
        data: [...model.timeBinLabels],
        axisLine: {
          show: true,
          lineStyle: { color: CADENCE_CHART_AXIS_COLOR, width: 1 },
        },
        axisTick: { show: true, alignWithLabel: true },
        nameTextStyle: { color: CADENCE_CHART_AXIS_COLOR, fontSize: 11 },
        axisLabel: {
          color: CADENCE_CHART_AXIS_COLOR,
          fontSize: 8,
          interval: timeLabelStride - 1,
          hideOverlap: true,
          formatter: (value: string) => value.split('–')[0] ?? value,
        },
        splitLine: { lineStyle: { color: CADENCE_CHART_GRID_COLOR } },
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
        splitLine: { lineStyle: { color: CADENCE_CHART_GRID_COLOR } },
      },
      visualMap: {
        min: model.minHr,
        max: model.maxHr,
        calculable: false,
        orient: 'vertical',
        right: 4,
        top: 'center',
        itemHeight: 64,
        itemWidth: 10,
        text: [
          transloco.translate('activity.cadenceHrDrift.hrHigh'),
          transloco.translate('activity.cadenceHrDrift.hrLow'),
        ],
        textStyle: { color: CADENCE_CHART_AXIS_COLOR, fontSize: 9 },
        inRange: { color: [...CADENCE_HR_DRIFT_COLORS] },
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
