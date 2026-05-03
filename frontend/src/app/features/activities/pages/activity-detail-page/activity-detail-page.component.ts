import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { TranslocoPipe } from '@ngneat/transloco';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  catchError,
  concatMap,
  distinctUntilChanged,
  finalize,
  forkJoin,
  map,
  of,
  switchMap,
} from 'rxjs';

import type { ActivityDetailSummary, TrackPointChartPublicDto, TrackPointRoute } from '../../../../shared/models/activity.model';
import { ActivitiesApiService } from '../../data/activities-api.service';
import { ActivitySummary } from './components/activity-summary/activity-summary';
import { ActivityMap } from './components/activity-map/activity-map';
import { ActivityMainChart } from './components/activity-main-chart/activity-main-chart';

@Component({
  standalone: true,
  selector: 'app-activity-detail-page',
  imports: [TranslocoPipe, MatProgressSpinnerModule, ActivitySummary, ActivityMap, ActivityMainChart],
  templateUrl: './activity-detail-page.component.html',
})
export class ActivityDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly activitiesApi = inject(ActivitiesApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly activity = signal<ActivityDetailSummary | null>(null);
  readonly loading = signal(false);
  readonly loadError = signal(false);

  readonly activityRoute = signal<TrackPointRoute[] | null>(null);
  readonly activityMainChart = signal<TrackPointChartPublicDto | null>(null);

  constructor() {
    this.route.paramMap
      .pipe(
        map((p) => p.get('activityId')?.trim() || null),
        distinctUntilChanged(),
        switchMap((activityId) => {
          this.activity.set(null);
          this.activityRoute.set(null);
          this.activityMainChart.set(null);
          this.loadError.set(false);
          if (!activityId) {
            return of<DetailViewModel>(null);
          }
          this.loading.set(true);
          return this.activitiesApi.getActivityById(activityId).pipe(
            catchError(() => {
              this.loadError.set(true);
              return of<ActivityDetailSummary | null>(null);
            }),
            switchMap((activity) => {
              if (!activity) {
                return of<DetailViewModel>(null);
              }
              return forkJoin({
                route: this.activitiesApi.getActivityRoute(activity.id).pipe(
                  catchError(() => of<TrackPointRoute[]>([])),
                ),
                chart: this.activitiesApi.getActivityChartData(activity.id).pipe(
                  catchError(() => of<TrackPointChartPublicDto | null>(null)),
                ),
              }).pipe(
                map(({ route, chart }) => ({
                  activity: activity,
                  route,
                  chart,
                })),
              );
            }),
            finalize(() => this.loading.set(false)),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((view) => {
        if (view) {
          this.activity.set(view.activity);
          this.activityRoute.set(view.route);
          this.activityMainChart.set(view.chart);
        } else {
          this.activity.set(null);
          this.activityRoute.set(null);
          this.activityMainChart.set(null);
        }
      });
  }
}

type DetailViewModel = {
  activity: ActivityDetailSummary;
  route: TrackPointRoute[];
  chart: TrackPointChartPublicDto | null;
} | null;
