import { Component, inject, OnInit, signal } from '@angular/core';
import { finalize } from 'rxjs';

import type { UserProfile } from '../../../shared/models/user-profile.model';
import { UsersApiService } from '../data/users-api.service';

@Component({
  selector: 'app-user-sidebar-panel',
  imports: [],
  templateUrl: './user-sidebar-panel.html',
  styleUrl: './user-sidebar-panel.scss',
})
export class UserSidebarPanel implements OnInit {
  private readonly usersApi = inject(UsersApiService);

  readonly user = signal<UserProfile | null>(null);
  readonly loading = signal(true);
  readonly loadError = signal<string | null>(null);

  ngOnInit(): void {
    this.usersApi
      .getUserProfile()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (profile) => {
          this.user.set(profile);
          this.loadError.set(null);
        },
        error: () => {
          this.user.set(null);
          this.loadError.set('No se pudo cargar el perfil.');
        },
      });
  }
}
