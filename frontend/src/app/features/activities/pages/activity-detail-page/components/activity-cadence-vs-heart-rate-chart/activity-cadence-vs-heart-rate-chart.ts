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
import {
  CADENCE_CHART_AXIS_COLOR,
  CADENCE_CHART_GRID_COLOR,
  CADENCE_HEATMAP_AXIS_BOUNDARY_GAP,
  CADENCE_HEATMAP_FREQUENCY_COLORS,
  CADENCE_HR_LINE_COLOR,
} from '@features/activities/utils/cadence-metrics.constants';
import type { CadenceHeartRateHeatmapViewModel } from '@features/activities/utils/cadence-heart-rate-heatmap.util';
import { formatHeartRateBinRangeLabel } from '@features/activities/utils/cadence-heart-rate-heatmap.util';
import { formatCadenceBinRangeLabel } from '@features/activities/utils/cadence-speed-heatmap.util';

const TOOLTIP_I18N = {
  cadence: 'activity.cadenceVsHeartRate.tooltipCadence',
  heartRate: 'activity.cadenceVsHeartRate.tooltipHeartRate',
  samples: 'activity.cadenceVsHeartRate.tooltipSamples',
  time: 'activity.cadenceVsHeartRate.tooltipTime',
  percentSamples: 'activity.cadenceVsHeartRate.tooltipPercentSamples',
  percentTime: 'activity.cadenceVsHeartRate.tooltipPercentTime',
} as const;

@Component({
  selector: 'app-activity-cadence-vs-heart-rate-chart',
  imports: [NgxEchartsDirective, TranslocoPipe],
  templateUrl: './activity-cadence-vs-heart-rate-chart.html',
  styleUrl: './activity-cadence-vs-heart-rate-chart.scss',
})
export class ActivityCadenceVsHeartRateChart {
  private readonly transloco = inject(TranslocoService);

  readonly heatmap = input<CadenceHeartRateHeatmapViewModel | null>(null);

  private readonly langTick = createTranslocoLangTick(this.transloco);

  readonly chartLangKey = computed(() => this.langTick());

  readonly frequencyLegendColors = [...CADENCE_HEATMAP_FREQUENCY_COLORS];

  readonly chartOptions = computed<EChartsOption | null>(() => {
    this.langTick();
    const model = this.heatmap();
    if (!model || model.data.length === 0) {
      return null;
    }

    const transloco = this.transloco;
    const cadenceAxis = transloco.translate('activity.cadenceVsHeartRate.axisCadence');
    const avgLineLabel = transloco.translate('activity.cadenceVsHeartRate.avgHrLine');

    const cadenceLabelStride = Math.max(1, Math.ceil(model.cadenceBinLabels.length / 8));
    const hrLabelStride = Math.max(1, Math.ceil(model.hrBinLabels.length / 6));

    const lineData = model.avgHrByCadenceBin
      .map((hr, index) => (hr != null ? [index, hr] : null))
      .filter((row): row is [number, number] => row != null);

    return {
      animationDuration: ECHARTS_ANIMATION_DURATION_MS,
      grid: {
        left: 12,
        right: 52,
        top: 20,
        bottom: 8,
        containLabel: true,
      },
      tooltip: {
        ...CADENCE_HEATMAP_TOOLTIP_STYLE,
        position: containedTooltipPosition,
        formatter: (params: unknown) => {
          const p = params as { seriesType?: string; data?: [number, number, number] };
          if (p.seriesType === 'line') {
            return '';
          }
          const tuple = p.data;
          if (!tuple) {
            return '';
          }
          const [x, y] = tuple;
          const meta = model.cellMeta.get(`${x},${y}`);
          if (!meta) {
            return '';
          }
          const t = transloco;
          const keys = TOOLTIP_I18N;
          return formatEchartsTooltipTable([
            {
              label: t.translate(keys.cadence),
              value: formatCadenceBinRangeLabel(meta.cadenceMin, model.cadenceBucket, model.unit),
            },
            {
              label: t.translate(keys.heartRate),
              value: formatHeartRateBinRangeLabel(meta.hrMin, model.hrBucket),
            },
            { label: t.translate(keys.samples), value: String(meta.count) },
            { label: t.translate(keys.time), value: formatElapsedActivityTime(meta.timeSec) },
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
        name: cadenceAxis,
        nameLocation: 'middle',
        nameGap: 26,
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
          interval: cadenceLabelStride - 1,
          hideOverlap: true,
        },
        splitLine: { lineStyle: { color: CADENCE_CHART_GRID_COLOR } },
      },
      yAxis: [
        {
          type: 'category',
          zlevel: 2,
          boundaryGap: CADENCE_HEATMAP_AXIS_BOUNDARY_GAP,
          data: [...model.hrBinLabels],
          axisLine: {
            show: true,
            lineStyle: { color: CADENCE_CHART_AXIS_COLOR, width: 1 },
          },
          axisTick: { show: true, alignWithLabel: true },
          nameTextStyle: { color: CADENCE_CHART_AXIS_COLOR, fontSize: 11 },
          axisLabel: {
            color: CADENCE_CHART_AXIS_COLOR,
            fontSize: 9,
            interval: hrLabelStride - 1,
            hideOverlap: true,
          },
          splitLine: { lineStyle: { color: CADENCE_CHART_GRID_COLOR } },
        },
        {
          type: 'value',
          min: model.hrLineMin,
          max: model.hrLineMax,
          position: 'right',
          axisLine: { show: false },
          axisTick: { show: false },
          splitLine: { show: false },
          axisLabel: {
            color: CADENCE_HR_LINE_COLOR,
            fontSize: 9,
            formatter: (v: number) => `${v}`,
          },
        },
      ],
      visualMap: {
        min: 0,
        max: model.maxCount,
        calculable: false,
        orient: 'vertical',
        right: 4,
        top: 'center',
        itemHeight: 64,
        itemWidth: 10,
        text: ['', ''],
        show: true,
        textStyle: { color: CADENCE_CHART_AXIS_COLOR, fontSize: 9 },
        inRange: { color: [...CADENCE_HEATMAP_FREQUENCY_COLORS] },
      },
      series: [
        {
          type: 'heatmap',
          zlevel: 1,
          yAxisIndex: 0,
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
        {
          type: 'line',
          name: avgLineLabel,
          yAxisIndex: 1,
          zlevel: 3,
          smooth: 0.35,
          symbol: 'circle',
          symbolSize: 7,
          lineStyle: { color: CADENCE_HR_LINE_COLOR, width: 2 },
          itemStyle: { color: CADENCE_HR_LINE_COLOR, borderWidth: 2, borderColor: '#fff' },
          data: lineData,
        },
      ],
    };
  });
}
