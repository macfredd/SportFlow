import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoPipe, TranslocoService } from '@ngneat/transloco';
import { map, merge, of } from 'rxjs';

import { translocoLangToDateLocale } from '../../../../../../core/i18n/transloco-date-locale';
import type { ActivityDetailSummary } from '../../../../../../shared/models/activity.model';
import {
  activityDetailSpeedUnitKey,
  formatDurationHms,
  formatPacePerDistanceUnit,
  isMissingHeartRate,
  sportTypeIconName,
  sportTypeLabelKey,
} from '../../../../utils/activity-display.util';

@Component({
  standalone: true,
  selector: 'app-activity-summary',
  imports: [DatePipe, DecimalPipe, MatIconModule, TranslocoPipe],
  templateUrl: './activity-summary.html',
  styleUrl: './activity-summary.scss',
})
export class ActivitySummary {
  private readonly transloco = inject(TranslocoService);

  readonly activity = input.required<ActivityDetailSummary>();

  /** Updates when the user switches language so `DatePipe` formats month/weekday names correctly. */
  readonly dateLocale = toSignal(
    merge(of(this.transloco.getActiveLang()), this.transloco.langChanges$).pipe(
      map((lang) => translocoLangToDateLocale(lang)),
    ),
    { initialValue: translocoLangToDateLocale(this.transloco.getActiveLang()) },
  );

  readonly sportLabelKey = computed(() => sportTypeLabelKey(this.activity().sport_type));

  readonly sportIconName = computed(() => sportTypeIconName(this.activity().sport_type));

  readonly durationFormatted = computed(() =>
    formatDurationHms(this.activity().duration_seconds),
  );

  readonly paceFormatted = computed(() => {
    const a = this.activity();
    return formatPacePerDistanceUnit(a.duration_seconds, a.distance.value);
  });

  readonly paceSuffixKey = computed(() =>
    this.activity().distance.unit === 'km'
      ? 'activity.summary.paceSuffixKm'
      : 'activity.summary.paceSuffixMi',
  );

  readonly distanceUnitKey = computed(() => `units.distance.${this.activity().distance.unit}`);

  readonly avgSpeedUnitKey = computed(() =>
    activityDetailSpeedUnitKey(this.activity().avg_speed.unit),
  );

  readonly maxSpeedUnitKey = computed(() =>
    activityDetailSpeedUnitKey(this.activity().max_speed.unit),
  );

  readonly avgHeartRateBpm = computed(() => {
    const v = this.activity().avg_heart_rate;
    return isMissingHeartRate(v) ? null : v;
  });

  readonly maxHeartRateBpm = computed(() => {
    const v = this.activity().max_heart_rate;
    return isMissingHeartRate(v) ? null : v;
  });
}
