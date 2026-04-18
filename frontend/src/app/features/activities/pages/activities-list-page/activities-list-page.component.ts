import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, ViewChild, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslocoPipe } from '@ngneat/transloco';
import { forkJoin } from 'rxjs';

import type { Activity } from '../../../../shared/models/activity.model';
import type { UserConfig } from '../../../../shared/models/user-config.model';
import { ActivitiesApiService } from '../../data/activities-api.service';
import { UserConfigApiService } from '../../data/user-config-api.service';
import {
  formatActivityDistance,
  formatDurationHms,
  sportTypeIconName,
  sportTypeLabelKey,
  toNumber,
} from '../../utils/activity-display.util';

@Component({
  selector: 'app-activities-list-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    TranslocoPipe,
  ],
  templateUrl: './activities-list-page.component.html',
  styleUrl: './activities-list-page.component.scss',
})
export class ActivitiesListPageComponent implements OnInit {
  private readonly activitiesApi = inject(ActivitiesApiService);
  private readonly userConfigApi = inject(UserConfigApiService);
  private readonly cdr = inject(ChangeDetectorRef);

  @ViewChild(MatSort) private sort!: MatSort;
  @ViewChild(MatPaginator) private paginator!: MatPaginator;

  readonly loading = signal(true);
  readonly loadErrorKey = signal<string | null>(null);
  readonly userConfig = signal<UserConfig | null>(null);

  readonly dataSource = new MatTableDataSource<Activity>([]);

  readonly displayedColumns: string[] = [
    'sport_type',
    'start_time',
    'duration_seconds',
    'distance_meters',
    'detail',
    'export',
  ];

  readonly sportIcon = sportTypeIconName;
  readonly sportLabelKey = sportTypeLabelKey;
  readonly formatDuration = formatDurationHms;

  ngOnInit(): void {
    this.dataSource.sortingDataAccessor = (item, prop) => {
      switch (prop) {
        case 'duration_seconds':
          return item.duration_seconds;
        case 'distance_meters':
          return toNumber(item.distance_meters);
        case 'start_time':
          return new Date(item.start_time).getTime();
        case 'sport_type':
          return item.sport_type;
        default:
          return '';
      }
    };

    this.dataSource.filterPredicate = (data, filter) => {
      let distance: number;
      if (this.userConfig()?.preferred_distance_unit === 'km') {
        distance = toNumber(data.distance_meters) / 1000;
      } else if (this.userConfig()?.preferred_distance_unit === 'mi') {
        distance = toNumber(data.distance_meters) / 1609.34;
      } else {
        distance = toNumber(data.distance_meters);
      }

      const duration = formatDurationHms(toNumber(data.duration_seconds));
      const t = [
        data.sport_type,
        data.start_time.slice(0, 10),
        duration,
        String(distance),
      ]
        .join(' ')
        .toLowerCase();
      return t.includes(filter);
    };

    forkJoin({
      config: this.userConfigApi.getConfig(),
      activities: this.activitiesApi.list(),
    }).subscribe({
      next: ({ config, activities }) => {
        this.userConfig.set(config);
        this.dataSource.data = activities;
        this.loading.set(false);
        this.cdr.detectChanges();
        if (this.sort) {
          this.dataSource.sort = this.sort;
        }
        if (this.paginator) {
          this.dataSource.paginator = this.paginator;
        }
      },
      error: () => {
        this.loadErrorKey.set('activity.listError');
        this.loading.set(false);
      },
    });
  }

  applyFilter(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.dataSource.filter = value.trim().toLowerCase();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  distanceDisplay(row: Activity): string {
    return formatActivityDistance(
      toNumber(row.distance_meters),
      this.userConfig()?.preferred_distance_unit,
    );
  }

  startDateOnly(iso: string): string {
    return iso.slice(0, 10);
  }
}
