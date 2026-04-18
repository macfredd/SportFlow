import { Component, inject, OnInit, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoPipe } from '@ngneat/transloco';

import type { UserProfile } from '../../../shared/models/user-profile.model';
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

  readonly user = signal<UserProfile | null>(null);
  readonly loading = signal(true);
  readonly loadErrorKey = signal<string | null>(null);

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
