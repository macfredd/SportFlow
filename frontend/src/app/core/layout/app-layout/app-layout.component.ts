import { BreakpointObserver } from '@angular/cdk/layout';
import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import {
  MatSidenav,
  MatSidenavContainer,
  MatSidenavContent,
} from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { map } from 'rxjs';

import { UserSidebarPanel } from '../../../features/profile/user-sidebar-panel/user-sidebar-panel';
import { LastActivitySidebarPanel } from '../../../features/activities/widgets/last-activity-sidebar-panel/last-activity-sidebar-panel';
import { TotalActivitySidebarPanel } from '../../../features/activities/widgets/total-activity-sidebar-panel/total-activity-sidebar-panel';

export interface AppNavLink {
  readonly label: string;
  readonly path: string;
  readonly exact?: boolean;
}

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatSidenavContainer,
    MatSidenav,
    MatSidenavContent,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    UserSidebarPanel,
    LastActivitySidebarPanel,
    TotalActivitySidebarPanel
  ],
  templateUrl: './app-layout.component.html',
  styleUrl: './app-layout.component.scss',
})
export class AppLayoutComponent {
  private readonly breakpoint = inject(BreakpointObserver);

  readonly navLinks: readonly AppNavLink[] = [
    { label: 'Home', path: '/', exact: true },
    { label: 'Actividades', path: '/activities', exact: false },
    { label: 'Mapa', path: '/mapa', exact: false },
    { label: 'Fotos', path: '/fotos', exact: false },
    { label: 'Retos', path: '/retos', exact: false },
  ];

  readonly isCompact = toSignal(
    this.breakpoint
      .observe('(max-width: 959.98px)')
      .pipe(map((state) => state.matches)),
    { initialValue: false },
  );

  readonly sidenavMode = computed(() =>
    this.isCompact() ? 'over' : 'side',
  );

  readonly sidebarOpen = signal(true);

  constructor() {
    effect(() => {
      const compact = this.isCompact();
      untracked(() => this.sidebarOpen.set(!compact));
    });
  }

  toggleSidebar(): void {
    this.sidebarOpen.update((open) => !open);
  }

  onSidenavOpenedChange(opened: boolean): void {
    this.sidebarOpen.set(opened);
  }
}
