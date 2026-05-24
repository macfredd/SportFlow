import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { TranslocoPipe } from '@ngneat/transloco';

import type { ActivitySplitsViewModel } from '../../../../utils/activity-splits.util';
import type { HeartRateZonesViewModel } from '../../../../utils/heart-rate-zones.util';
import { ActivityHeartRateMetricsGrid } from '../activity-heart-rate-metrics-grid/activity-heart-rate-metrics-grid';

@Component({
  selector: 'app-activity-metrics-tabs',
  imports: [MatTabsModule, MatIconModule, TranslocoPipe, ActivityHeartRateMetricsGrid],
  templateUrl: './activity-metrics-tabs.html',
  styleUrl: './activity-metrics-tabs.scss',
})
export class ActivityMetricsTabs {
  readonly heartRateZones = input<HeartRateZonesViewModel | null>(null);
  readonly splits = input<ActivitySplitsViewModel | null>(null);
}
