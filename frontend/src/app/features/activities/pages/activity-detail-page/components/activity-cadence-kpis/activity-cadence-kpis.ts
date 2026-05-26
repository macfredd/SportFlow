import { DecimalPipe } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoPipe } from '@ngneat/transloco';

import type { CadenceMetricsViewModel } from '../../../../utils/cadence-metrics.util';

@Component({
  selector: 'app-activity-cadence-kpis',
  imports: [DecimalPipe, MatIconModule, TranslocoPipe],
  templateUrl: './activity-cadence-kpis.html',
  styleUrl: './activity-cadence-kpis.scss',
})
export class ActivityCadenceKpis {
  readonly metrics = input<CadenceMetricsViewModel | null>(null);

  readonly unitKey = computed(() => {
    const unit = this.metrics()?.unit ?? 'spm';
    return unit === 'rpm' ? 'activity.cadence.unitRpm' : 'activity.cadence.unitSpm';
  });
}
