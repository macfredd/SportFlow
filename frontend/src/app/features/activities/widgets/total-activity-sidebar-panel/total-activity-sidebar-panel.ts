import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoPipe } from '@ngneat/transloco';
import { finalize } from 'rxjs';

import type { ActivitiesBySportType } from '../../../../shared/models/activity.model';
import { ActivitiesApiService } from '../../data/activities-api.service';
import { sportTypeIconName, sportTypeLabelKey } from '../../utils/activity-display.util';

export type TotalActivityPeriodId = 'w' | 'm' | '3m' | '6m' | '1y' | 'all';

export interface TotalActivityPeriod {
  readonly id: TotalActivityPeriodId;
  readonly labelKey: string;
  readonly hintKey: string;
  readonly days: number | null;
}

export const TOTAL_ACTIVITY_PERIODS: readonly TotalActivityPeriod[] = [
  { id: 'w', labelKey: 'activity.periods.w', hintKey: 'activity.periods.hint.w', days: 7 },
  { id: 'm', labelKey: 'activity.periods.m', hintKey: 'activity.periods.hint.m', days: 30 },
  { id: '3m', labelKey: 'activity.periods.3m', hintKey: 'activity.periods.hint.3m', days: 90 },
  { id: '6m', labelKey: 'activity.periods.6m', hintKey: 'activity.periods.hint.6m', days: 180 },
  { id: '1y', labelKey: 'activity.periods.1y', hintKey: 'activity.periods.hint.1y', days: 365 },
  { id: 'all', labelKey: 'activity.periods.all', hintKey: 'activity.periods.hint.all', days: null },
] as const;

@Component({
  selector: 'app-total-activity-sidebar-panel',
  imports: [MatIconModule, MatTooltipModule, TranslocoPipe],
  templateUrl: './total-activity-sidebar-panel.html',
  styleUrl: './total-activity-sidebar-panel.scss',
})
export class TotalActivitySidebarPanel implements OnInit {
  private readonly activitiesApi = inject(ActivitiesApiService);

  readonly periods = TOTAL_ACTIVITY_PERIODS;
  readonly selectedPeriodId = signal<TotalActivityPeriodId>('w');

  readonly totalActivitiesBySportType = signal<ActivitiesBySportType[]>([]);
  readonly loading = signal(true);
  readonly loadErrorKey = signal<string | null>(null);

  readonly sportIcon = sportTypeIconName;
  readonly sportLabelKey = sportTypeLabelKey;

  readonly grandTotal = computed(() =>
    this.totalActivitiesBySportType().reduce((sum, row) => sum + row.total, 0),
  );

  readonly maxForBars = computed(() => {
    const rows = this.totalActivitiesBySportType();
    if (!rows.length) {
      return 0;
    }
    return Math.max(...rows.map((r) => r.total));
  });

  ngOnInit(): void {
    this.reload();
  }

  selectPeriod(id: TotalActivityPeriodId): void {
    this.selectedPeriodId.set(id);
    this.reload();
  }

  isPeriodSelected(id: TotalActivityPeriodId): boolean {
    return this.selectedPeriodId() === id;
  }

  daysForSelectedPeriod(): number | null {
    const id = this.selectedPeriodId();
    const p = this.periods.find((x) => x.id === id);
    return p?.days ?? null;
  }

  barFillPercent(total: number): number {
    const max = this.maxForBars();
    if (max <= 0 || total <= 0) {
      return 0;
    }
    return (total / max) * 100;
  }

  private reload(): void {
    this.loading.set(true);
    this.loadErrorKey.set(null);
    const days = this.daysForSelectedPeriod();

    this.activitiesApi
      .getTotalActivitiesBySportType(days)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (rows) => {
          this.totalActivitiesBySportType.set(rows);
          this.loadErrorKey.set(null);
        },
        error: () => {
          this.totalActivitiesBySportType.set([]);
          this.loadErrorKey.set('activity.totalError');
        },
      });
  }
}
