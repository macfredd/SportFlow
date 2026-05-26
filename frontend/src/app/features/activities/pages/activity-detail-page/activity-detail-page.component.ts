import { BreakpointObserver } from '@angular/cdk/layout';
import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { TranslocoPipe } from '@ngneat/transloco';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  catchError,
  distinctUntilChanged,
  finalize,
  forkJoin,
  map,
  of,
  switchMap,
} from 'rxjs';

import type {
  ActivityDetailSummary,
  TrackPointChartPublicDto,
  TrackPointRoute,
} from '../../../../shared/models/activity.model';
import { LayoutShellService } from '../../../../core/layout/layout-shell.service';
import { ActivitiesApiService } from '../../data/activities-api.service';
import { ActivitySummary } from './components/activity-summary/activity-summary';
import { ActivityMap } from './components/activity-map/activity-map';
import {
  ActivityMainChart,
  type TrackPointHoverPayload,
} from './components/activity-main-chart/activity-main-chart';
import { ActivityMetricsTabs } from './components/activity-metrics-tabs/activity-metrics-tabs';
import { ActivitySplitsTable } from './components/activity-splits-table/activity-splits-table';
import { UserProfile } from '../../../../shared/models/user-profile.model';
import { UsersApiService } from '../../../profile/data/users-api.service';
import { buildActivitySplitsViewModel } from '../../utils/activity-splits.util';
import { buildCadenceMetricsViewModel } from '../../utils/cadence-metrics.util';
import {
  buildHeartRateZonesViewModel,
} from '../../utils/heart-rate-zones.util';

@Component({
  standalone: true,
  selector: 'app-activity-detail-page',
  imports: [
    TranslocoPipe,
    MatProgressSpinnerModule,
    ActivitySummary,
    ActivityMap,
    ActivityMainChart,
    ActivityMetricsTabs,
    ActivitySplitsTable,
  ],
  templateUrl: './activity-detail-page.component.html',
  styleUrl: './activity-detail-page.component.scss',
})
export class ActivityDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly activitiesApi = inject(ActivitiesApiService);
  private readonly usersApi = inject(UsersApiService);
  private readonly breakpoint = inject(BreakpointObserver);
  private readonly layoutShell = inject(LayoutShellService);

  private readonly destroyRef = inject(DestroyRef);

  readonly userProfile = signal<UserProfile | null>(null);
  readonly activity = signal<ActivityDetailSummary | null>(null);
  readonly loading = signal(false);
  readonly loadError = signal(false);

  readonly activityRoute = signal<TrackPointRoute[] | null>(null);
  readonly activityMainChart = signal<TrackPointChartPublicDto | null>(null);
  readonly highlightedTrackPointId = signal<string | null>(null);
  readonly highlightedTrackPointSeq = signal(0);

  onTrackPointHover(payload: TrackPointHoverPayload): void {
    this.highlightedTrackPointId.set(payload.trackPointId);
    this.highlightedTrackPointSeq.set(payload.seq);
  }

  readonly heartRateZones = computed(() =>
    buildHeartRateZonesViewModel(
      this.activity()?.start_time ?? '',
      this.userProfile()?.date_of_birth,
      this.activityMainChart()?.track_points ?? [],
    ),
  );

  readonly activitySplits = computed(() =>
    buildActivitySplitsViewModel(this.activityMainChart()),
  );

  readonly cadenceMetrics = computed(() =>
    buildCadenceMetricsViewModel(this.activityMainChart(), this.activity()?.sport_type),
  );

  private readonly viewportLayout = toSignal(
    this.breakpoint
      .observe(['(max-width: 767.98px)', '(max-width: 1199.98px)'])
      .pipe(
        map((state) => ({
          isMobile: state.breakpoints['(max-width: 767.98px)'],
          isMedium: state.breakpoints['(max-width: 1199.98px)'],
        })),
      ),
    { initialValue: { isMobile: false, isMedium: false } },
  );

  /** Hide on small viewports; on medium widths require sidebar closed for enough map+splits room. */
  readonly showSplits = computed(() => {
    const { isMobile, isMedium } = this.viewportLayout();
    if (isMobile) {
      return false;
    }
    if (!isMedium) {
      return true;
    }
    return !this.layoutShell.sidebarOpen();
  });

  constructor() {
    this.route.paramMap
      .pipe(
        map((p) => p.get('activityId')?.trim() || null),
        distinctUntilChanged(),
        switchMap((activityId) => {
          this.activity.set(null);
          this.activityRoute.set(null);
          this.activityMainChart.set(null);
          this.highlightedTrackPointId.set(null);
          this.highlightedTrackPointSeq.set(0);
          this.userProfile.set(null);
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
                userProfile: this.usersApi
                  .getUserProfile()
                  .pipe(catchError(() => of<UserProfile | null>(null))),
                route: this.activitiesApi
                  .getActivityRoute(activity.id)
                  .pipe(catchError(() => of<TrackPointRoute[]>([]))),
                chart: this.activitiesApi
                  .getActivityChartData(activity.id)
                  .pipe(catchError(() => of<TrackPointChartPublicDto | null>(null))),
              }).pipe(
                map(({ route, chart, userProfile }) => ({
                  activity,
                  route,
                  chart,
                  userProfile,
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
          this.userProfile.set(view.userProfile);
        } else {
          this.activity.set(null);
          this.activityRoute.set(null);
          this.activityMainChart.set(null);
          this.highlightedTrackPointId.set(null);
          this.highlightedTrackPointSeq.set(0);
          this.userProfile.set(null);
        }
      });
  }
}

type DetailViewModel = {
  userProfile: UserProfile | null;
  activity: ActivityDetailSummary;
  route: TrackPointRoute[];
  chart: TrackPointChartPublicDto | null;
} | null;
