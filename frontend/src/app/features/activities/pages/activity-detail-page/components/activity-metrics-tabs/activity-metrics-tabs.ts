import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { TranslocoPipe } from '@ngneat/transloco';

import type { ActivitySplitsViewModel } from '../../../../utils/activity-splits.util';
import type { CadenceDistributionViewModel, CadenceMetricsViewModel } from '../../../../utils/cadence-metrics.util';
import type { CadenceSpeedHeatmapViewModel } from '../../../../utils/cadence-speed-heatmap.util';
import { ActivityCadenceVsSpeedChart } from '../activity-cadence-vs-speed-chart/activity-cadence-vs-speed-chart';
import type { HeartRateZonesViewModel } from '../../../../utils/heart-rate-zones.util';
import { ActivityCadenceDistributionChart } from '../activity-cadence-distribution-chart/activity-cadence-distribution-chart';
import { ActivityCadenceKpis } from '../activity-cadence-kpis/activity-cadence-kpis';
import { ActivityHeartRateMetricsGrid } from '../activity-heart-rate-metrics-grid/activity-heart-rate-metrics-grid';

@Component({
  selector: 'app-activity-metrics-tabs',
  imports: [
    MatTabsModule,
    MatIconModule,
    TranslocoPipe,
    ActivityHeartRateMetricsGrid,
    ActivityCadenceKpis,
    ActivityCadenceDistributionChart,
    ActivityCadenceVsSpeedChart,
  ],
  templateUrl: './activity-metrics-tabs.html',
  styleUrl: './activity-metrics-tabs.scss',
})
export class ActivityMetricsTabs {
  readonly heartRateZones = input<HeartRateZonesViewModel | null>(null);
  readonly splits = input<ActivitySplitsViewModel | null>(null);
  readonly cadenceMetrics = input<CadenceMetricsViewModel | null>(null);
  readonly cadenceDistribution = input<CadenceDistributionViewModel | null>(null);
  readonly cadenceSpeedHeatmap = input<CadenceSpeedHeatmapViewModel | null>(null);
}
