import { Component, computed, input } from '@angular/core';

import type { ActivitySplitsViewModel } from '@features/activities/utils/activity-splits.util';
import type { HeartRateZonesViewModel } from '@features/activities/utils/heart-rate-zones.util';
import { ActivityHeartRateBySplitChart } from '../activity-heart-rate-by-split-chart/activity-heart-rate-by-split-chart';
import { ActivityHeartRateByTimeChart } from '../activity-heart-rate-by-time-chart/activity-heart-rate-by-time-chart';
import { ActivityHeartRateZonesChart } from '../activity-heart-rate-zones-chart/activity-heart-rate-zones-chart';

@Component({
  selector: 'app-activity-heart-rate-metrics-grid',
  imports: [
    ActivityHeartRateZonesChart,
    ActivityHeartRateByTimeChart,
    ActivityHeartRateBySplitChart,
  ],
  templateUrl: './activity-heart-rate-metrics-grid.html',
  styleUrl: './activity-heart-rate-metrics-grid.scss',
})
export class ActivityHeartRateMetricsGrid {
  readonly heartRateZones = input<HeartRateZonesViewModel | null>(null);
  readonly splits = input<ActivitySplitsViewModel | null>(null);

  readonly showHeartRateBySplit = computed(() =>
    (this.splits()?.rows ?? []).some((row) => row.avgHeartRate !== null),
  );
}
