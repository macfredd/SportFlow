import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoPipe } from '@ngneat/transloco';
import { finalize } from 'rxjs';

import type { LastActivitySummary } from '../../../../shared/models/activity.model';
import { ActivitiesApiService } from '../../data/activities-api.service';
import { sportTypeIconName, sportTypeLabelKey } from '../../utils/activity-display.util';

@Component({
  selector: 'app-last-activity-sidebar-panel',
  imports: [RouterLink, MatButtonModule, MatIconModule, TranslocoPipe],
  templateUrl: './last-activity-sidebar-panel.html',
  styleUrl: './last-activity-sidebar-panel.scss',
})
export class LastActivitySidebarPanel implements OnInit {
  private readonly activitiesApi = inject(ActivitiesApiService);

  readonly activity = signal<LastActivitySummary | null>(null);
  readonly loading = signal(true);
  readonly loadErrorKey = signal<string | null>(null);

  readonly sportIcon = sportTypeIconName;
  readonly sportLabelKey = sportTypeLabelKey;

  ngOnInit(): void {
    this.activitiesApi
      .getLastActivity()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (activity) => {
          this.activity.set(activity);
          this.loadErrorKey.set(null);
        },
        error: () => {
          this.activity.set(null);
          this.loadErrorKey.set('activity.lastActivityError');
        },
      });
  }
}
