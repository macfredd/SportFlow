import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoPipe, TranslocoService } from '@ngneat/transloco';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { combineLatest, finalize, map, merge, of, switchMap } from 'rxjs';

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

  readonly activity = signal<LastActivitySummary | null>(null);
  readonly loading = signal(true);
  readonly loadErrorKey = signal<string | null>(null);

  readonly sportIcon = sportTypeIconName;
  readonly sportLabelKey = sportTypeLabelKey;

  readonly relativeStartLabel = toSignal(
    combineLatest([
      toObservable(this.activity),
      merge(of(this.transloco.getActiveLang()), this.transloco.langChanges$).pipe(
        switchMap(() => this.transloco.selectTranslation()),
      ),
    ]).pipe(
      map(([act]) => {
        if (!act?.start_time) {
          return '';
        }
        return buildRelativeActivityStart(act.start_time, (key, params) =>
          this.transloco.translate(key, params),
        );
      }),
    ),
    { initialValue: '' },
  );

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
