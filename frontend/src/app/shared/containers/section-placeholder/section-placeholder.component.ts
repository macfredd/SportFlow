import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { TranslocoPipe } from '@ngneat/transloco';
import { map } from 'rxjs';

@Component({
  selector: 'app-section-placeholder',
  standalone: true,
  imports: [TranslocoPipe],
  template: `
    <section class="mx-auto max-w-6xl px-2 md:px-4">
      <h1
        class="text-2xl font-semibold tracking-tight text-[var(--text-primary)] md:text-3xl"
      >
        {{ titleKey() | transloco }}
      </h1>
      <p
        class="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--text-secondary)]"
      >
        {{ 'section.placeholder' | transloco }}
      </p>
    </section>
  `,
})
export class SectionPlaceholderComponent {
  private readonly route = inject(ActivatedRoute);

  readonly titleKey = toSignal(
    this.route.data.pipe(
      map((d) => (d['titleKey'] as string) ?? 'nav.section'),
    ),
    {
      initialValue:
        (this.route.snapshot.data['titleKey'] as string | undefined) ??
        'nav.section',
    },
  );
}
