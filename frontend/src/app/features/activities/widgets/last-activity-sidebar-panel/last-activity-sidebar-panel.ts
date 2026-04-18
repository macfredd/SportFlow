import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoPipe, TranslocoService } from '@ngneat/transloco';
import { toSignal } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

import type { LastActivitySummary } from '../../../../shared/models/activity.model';
import { buildRelativeActivityStart } from '../../../../shared/utils/relative-activity-start.util';
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
  private readonly transloco = inject(TranslocoService);

  private readonly activeLang = toSignal(this.transloco.langChanges$, {
    initialValue: this.transloco.getActiveLang(),
  });

  readonly activity = signal<LastActivitySummary | null>(null);
  readonly loading = signal(true);
  readonly loadErrorKey = signal<string | null>(null);

  readonly sportIcon = sportTypeIconName;
  readonly sportLabelKey = sportTypeLabelKey;

  readonly relativeStartLabel = computed(() => {
    this.activeLang();
    const act = this.activity();
    if (!act?.start_time) {
      return '';
    }
    return buildRelativeActivityStart(act.start_time, (key, params) =>
      this.transloco.translate(key, params),
    );
  });

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
