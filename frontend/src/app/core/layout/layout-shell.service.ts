import { Injectable, signal } from '@angular/core';

/** Shared shell state (e.g. sidebar) for content-area layout decisions. */
@Injectable({ providedIn: 'root' })
export class LayoutShellService {
  readonly sidebarOpen = signal(true);
}
