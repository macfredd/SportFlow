import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { finalize } from 'rxjs';

import type { LastActivitySummary } from '../../../../shared/models/activity.model';
import { ActivitiesApiService } from '../../data/activities-api.service';
import { sportTypeIconName, sportTypeLabel } from '../../utils/activity-display.util';

@Component({
  selector: 'app-last-activity-sidebar-panel',
  imports: [RouterLink, MatButtonModule, MatIconModule],
  templateUrl: './last-activity-sidebar-panel.html',
  styleUrl: './last-activity-sidebar-panel.scss',
})
export class LastActivitySidebarPanel implements OnInit {
  private readonly activitiesApi = inject(ActivitiesApiService);

  readonly activity = signal<LastActivitySummary | null>(null);
  readonly loading = signal(true);
  readonly loadError = signal<string | null>(null);

  readonly sportIcon = sportTypeIconName;
  readonly sportLabel = sportTypeLabel;

  ngOnInit(): void {
    this.activitiesApi
      .getLastActivity()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (activity) => {
          this.activity.set(activity);
          this.loadError.set(null);
        },
        error: () => {
          this.activity.set(null);
          this.loadError.set('No se pudo cargar la última actividad.');
        },
      });
  }
}
