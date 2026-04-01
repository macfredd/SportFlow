import { CommonModule } from '@angular/common';
import { Component, computed, input } from '@angular/core';

import type { WidgetContainerPadding } from '../../models/widget-container.model';

@Component({
  selector: 'app-widget-container',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './widget-container.component.html',
  styleUrl: './widget-container.component.scss',
})
export class WidgetContainerComponent {
  /** Optional heading; if both title and subtitle are empty, the header row is hidden. */
  readonly title = input<string | undefined>(undefined);

  /** Secondary line under the title. */
  readonly subtitle = input<string | undefined>(undefined);

  /** Inner padding for the default content slot. */
  readonly padding = input<WidgetContainerPadding>('md');

  readonly showHeader = computed(() => {
    const t = this.title()?.trim();
    const s = this.subtitle()?.trim();
    return !!t || !!s;
  });

  readonly bodyPaddingClass = computed(() => {
    switch (this.padding()) {
      case 'none':
        return '';
      case 'sm':
        return 'p-3 md:p-4';
      case 'md':
        return 'p-4 md:p-5';
    }
  });

  readonly headerPaddingClass = computed(() => {
    switch (this.padding()) {
      case 'none':
        return '';
      case 'sm':
        return 'px-3 py-2 md:px-4 md:py-3';
      case 'md':
        return 'px-4 py-3 md:px-5 md:py-4';
    }
  });

  /** Prefer title, then subtitle, for `role="region"` labelling. */
  readonly regionLabel = computed(() => {
    const t = this.title()?.trim();
    const s = this.subtitle()?.trim();
    return t || s || null;
  });
}
