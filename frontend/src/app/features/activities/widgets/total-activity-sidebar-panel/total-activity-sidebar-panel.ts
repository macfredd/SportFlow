import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { finalize } from 'rxjs';

import type { ActivitiesBySportType } from '../../../../shared/models/activity.model';
import { ActivitiesApiService } from '../../data/activities-api.service';
import { sportTypeIconName, sportTypeLabel } from '../../utils/activity-display.util';

export type TotalActivityPeriodId = 'w' | 'm' | '3m' | '6m' | '1y' | 'all';

export interface TotalActivityPeriod {
  readonly id: TotalActivityPeriodId;
  readonly label: string;
  readonly hint: string;
  readonly days: number | null;
}

export const TOTAL_ACTIVITY_PERIODS: readonly TotalActivityPeriod[] = [
  { id: 'w', label: 'W', hint: 'Semana (últimos 7 días)', days: 7 },
  { id: 'm', label: 'M', hint: 'Mes (últimos 30 días)', days: 30 },
  { id: '3m', label: '3M', hint: 'Tres meses (últimos 90 días)', days: 90 },
  { id: '6m', label: '6M', hint: 'Seis meses (últimos 180 días)', days: 180 },
  { id: '1y', label: '1Y', hint: 'Un año (últimos 365 días)', days: 365 },
  { id: 'all', label: 'All Time', hint: 'Todo el historial', days: null },
] as const;

@Component({
  selector: 'app-total-activity-sidebar-panel',
  imports: [MatIconModule, MatTooltipModule],
  templateUrl: './total-activity-sidebar-panel.html',
  styleUrl: './total-activity-sidebar-panel.scss',
})
export class TotalActivitySidebarPanel implements OnInit {
  private readonly activitiesApi = inject(ActivitiesApiService);

  readonly periods = TOTAL_ACTIVITY_PERIODS;
  readonly selectedPeriodId = signal<TotalActivityPeriodId>('w');

  readonly totalActivitiesBySportType = signal<ActivitiesBySportType[]>([]);
  readonly loading = signal(true);
  readonly loadError = signal<string | null>(null);

  readonly sportIcon = sportTypeIconName;
  readonly sportLabel = sportTypeLabel;

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
    this.loadError.set(null);
    const days = this.daysForSelectedPeriod();

    this.activitiesApi
      .getTotalActivitiesBySportType(days)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (rows) => {
          this.totalActivitiesBySportType.set(rows);
          this.loadError.set(null);
        },
        error: () => {
          this.totalActivitiesBySportType.set([]);
          this.loadError.set('No se pudieron cargar los totales por tipo de actividad.');
        },
      });
  }
}
