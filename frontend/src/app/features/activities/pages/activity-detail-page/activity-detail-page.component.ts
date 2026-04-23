import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { TranslocoPipe } from '@ngneat/transloco';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { catchError, distinctUntilChanged, finalize, map, of, switchMap } from 'rxjs';

import type { ActivityDetailSummary } from '../../../../shared/models/activity.model';
import { ActivitiesApiService } from '../../data/activities-api.service';
import { ActivitySummary } from './components/activity-summary/activity-summary';

@Component({
  standalone: true,
  selector: 'app-activity-detail-page',
  imports: [TranslocoPipe, MatProgressSpinnerModule, ActivitySummary],
  templateUrl: './activity-detail-page.component.html',
})
export class ActivityDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly activitiesApi = inject(ActivitiesApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly activity = signal<ActivityDetailSummary | null>(null);
  readonly loading = signal(false);
  readonly loadError = signal(false);

  constructor() {
    this.route.paramMap
      .pipe(
        map((p) => p.get('activityId')?.trim() || null),
        distinctUntilChanged(),
        switchMap((activityId) => {
          this.activity.set(null);
          this.loadError.set(false);
          if (!activityId) {
            return of(null);
          }
          this.loading.set(true);
          return this.activitiesApi.getActivityById(activityId).pipe(
            catchError(() => {
              this.loadError.set(true);
              return of(null);
            }),
            finalize(() => this.loading.set(false)),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((data) => this.activity.set(data));
  }
}
