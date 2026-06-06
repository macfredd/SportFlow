import { Component, computed, input } from '@angular/core';
import { TranslocoPipe } from '@ngneat/transloco';

import type { ActivitySplitsViewModel } from '@features/activities/utils/activity-splits.util';

@Component({
  selector: 'app-activity-splits-table',
  imports: [TranslocoPipe],
  templateUrl: './activity-splits-table.html',
  styleUrl: './activity-splits-table.scss',
})
export class ActivitySplitsTable {
  readonly splits = input<ActivitySplitsViewModel | null>(null);

  readonly rows = computed(() => this.splits()?.rows ?? []);
  readonly distanceUnit = computed(() => this.splits()?.distanceUnit ?? 'km');

  readonly paceSuffixKey = computed(() =>
    this.distanceUnit() === 'km'
      ? 'activity.splits.paceSuffixKm'
      : 'activity.splits.paceSuffixMi',
  );

  readonly showHeartRateColumn = computed(() =>
    this.rows().some((row) => row.avgHeartRate !== null),
  );
}
