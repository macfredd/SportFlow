import { Component, computed, input } from '@angular/core';

import type {
  CadenceDistributionViewModel,
  CadenceMetricsViewModel,
} from '@features/activities/utils/cadence-metrics.util';
import type { CadenceHeartRateHeatmapViewModel } from '@features/activities/utils/cadence-heart-rate-heatmap.util';
import type { CadenceHrDriftHeatmapViewModel } from '@features/activities/utils/cadence-hr-drift-heatmap.util';
import type { CadenceSpeedHeatmapViewModel } from '@features/activities/utils/cadence-speed-heatmap.util';
import { ActivityCadenceDistributionChart } from '../activity-cadence-distribution-chart/activity-cadence-distribution-chart';
import { ActivityCadenceHrDriftChart } from '../activity-cadence-hr-drift-chart/activity-cadence-hr-drift-chart';
import { ActivityCadenceKpis } from '../activity-cadence-kpis/activity-cadence-kpis';
import { ActivityCadenceVsHeartRateChart } from '../activity-cadence-vs-heart-rate-chart/activity-cadence-vs-heart-rate-chart';
import { ActivityCadenceVsSpeedChart } from '../activity-cadence-vs-speed-chart/activity-cadence-vs-speed-chart';

@Component({
  selector: 'app-activity-cadence-metrics-grid',
  imports: [
    ActivityCadenceKpis,
    ActivityCadenceDistributionChart,
    ActivityCadenceVsSpeedChart,
    ActivityCadenceVsHeartRateChart,
    ActivityCadenceHrDriftChart,
  ],
  templateUrl: './activity-cadence-metrics-grid.html',
  styleUrl: './activity-cadence-metrics-grid.scss',
})
export class ActivityCadenceMetricsGrid {
  readonly cadenceMetrics = input<CadenceMetricsViewModel | null>(null);
  readonly cadenceDistribution = input<CadenceDistributionViewModel | null>(null);
  readonly cadenceSpeedHeatmap = input<CadenceSpeedHeatmapViewModel | null>(null);
  readonly cadenceHeartRateHeatmap = input<CadenceHeartRateHeatmapViewModel | null>(null);
  readonly cadenceHrDriftHeatmap = input<CadenceHrDriftHeatmapViewModel | null>(null);

  readonly showHeartRateCharts = computed(
    () => this.cadenceHeartRateHeatmap() != null || this.cadenceHrDriftHeatmap() != null,
  );
}
