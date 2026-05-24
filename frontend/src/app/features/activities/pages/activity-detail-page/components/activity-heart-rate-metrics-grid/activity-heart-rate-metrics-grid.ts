import { Component, input } from '@angular/core';

import type { HeartRateZonesViewModel } from '../../../../utils/heart-rate-zones.util';
import { ActivityHeartRateByTimeChart } from '../activity-heart-rate-by-time-chart/activity-heart-rate-by-time-chart';
import { ActivityHeartRateChart } from '../activity-heart-rate-chart/activity-heart-rate-chart';

@Component({
  selector: 'app-activity-heart-rate-metrics-grid',
  imports: [ActivityHeartRateChart, ActivityHeartRateByTimeChart],
  templateUrl: './activity-heart-rate-metrics-grid.html',
  styleUrl: './activity-heart-rate-metrics-grid.scss',
})
export class ActivityHeartRateMetricsGrid {
  readonly heartRateZones = input<HeartRateZonesViewModel | null>(null);
}
