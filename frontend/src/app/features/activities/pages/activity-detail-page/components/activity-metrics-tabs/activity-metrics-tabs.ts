import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { TranslocoPipe } from '@ngneat/transloco';

import type { ActivitySplitsViewModel } from '@features/activities/utils/activity-splits.util';
import type { CadenceDistributionViewModel, CadenceMetricsViewModel } from '@features/activities/utils/cadence-metrics.util';
import type { CadenceHeartRateHeatmapViewModel } from '@features/activities/utils/cadence-heart-rate-heatmap.util';
import type { CadenceHrDriftHeatmapViewModel } from '@features/activities/utils/cadence-hr-drift-heatmap.util';
import type { CadenceSpeedHeatmapViewModel } from '@features/activities/utils/cadence-speed-heatmap.util';
import type { HeartRateZonesViewModel } from '@features/activities/utils/heart-rate-zones.util';
import { ActivityCadenceMetricsGrid } from '../activity-cadence-metrics-grid/activity-cadence-metrics-grid';
import { ActivityHeartRateMetricsGrid } from '../activity-heart-rate-metrics-grid/activity-heart-rate-metrics-grid';

@Component({
  selector: 'app-activity-metrics-tabs',
  imports: [
    MatTabsModule,
    MatIconModule,
    TranslocoPipe,
    ActivityHeartRateMetricsGrid,
    ActivityCadenceMetricsGrid,
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
  readonly cadenceHeartRateHeatmap = input<CadenceHeartRateHeatmapViewModel | null>(null);
  readonly cadenceHrDriftHeatmap = input<CadenceHrDriftHeatmapViewModel | null>(null);
}
