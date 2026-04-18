import { Component, inject, OnInit, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoPipe, TranslocoService } from '@ngneat/transloco';
import { combineLatest, map, merge, of, switchMap } from 'rxjs';

import type { UserProfile } from '../../../shared/models/user-profile.model';
import { formatHeightDisplay } from '../../../shared/utils/measurement-display.util';
import { ageInYearsFromIsoDate } from '../../../shared/utils/age-from-birth-date';
import { UsersApiService } from '../data/users-api.service';

@Component({
  selector: 'app-user-sidebar-panel',
  imports: [MatIconModule, TranslocoPipe],
  templateUrl: './user-sidebar-panel.html',
  styleUrl: './user-sidebar-panel.scss',
})
export class UserSidebarPanel implements OnInit {
  private readonly usersApi = inject(UsersApiService);
  private readonly transloco = inject(TranslocoService);

  readonly user = signal<UserProfile | null>(null);
  readonly loading = signal(true);
  readonly loadErrorKey = signal<string | null>(null);

  readonly heightDisplayLabel = toSignal(
    combineLatest([
      toObservable(this.user),
      merge(of(this.transloco.getActiveLang()), this.transloco.langChanges$).pipe(
        switchMap(() => this.transloco.selectTranslation()),
      ),
    ]).pipe(
      map(([u]) => {
        if (!u?.height) {
          return '';
        }
        return formatHeightDisplay(u.height, (key, params) =>
          this.transloco.translate(key, params),
        );
      }),
    ),
    { initialValue: '' },
  );

  ngOnInit(): void {
    this.usersApi
      .getUserProfile()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (profile) => {
          this.user.set(profile);
          this.loadErrorKey.set(null);
        },
        error: () => {
          this.user.set(null);
          this.loadErrorKey.set('user.error');
        },
      });
  }

  ageYears(u: UserProfile): number | null {
    return ageInYearsFromIsoDate(u.date_of_birth);
  }
}
