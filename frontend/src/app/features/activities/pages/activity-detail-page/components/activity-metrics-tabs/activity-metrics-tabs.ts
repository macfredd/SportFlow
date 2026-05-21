import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { TranslocoPipe } from '@ngneat/transloco';

import type { HeartRateZonesViewModel } from '../../../../utils/heart-rate-zones.util';
import { ActivityHeartRateChart } from '../activity-heart-rate-chart/activity-heart-rate-chart';

@Component({
  selector: 'app-activity-metrics-tabs',
  imports: [MatTabsModule, MatIconModule, TranslocoPipe, ActivityHeartRateChart],
  templateUrl: './activity-metrics-tabs.html',
  styleUrl: './activity-metrics-tabs.scss',
})
export class ActivityMetricsTabs {
  readonly heartRateZones = input<HeartRateZonesViewModel | null>(null);
}
