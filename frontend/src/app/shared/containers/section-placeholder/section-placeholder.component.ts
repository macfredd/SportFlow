import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';

@Component({
  selector: 'app-section-placeholder',
  standalone: true,
  template: `
    <section class="mx-auto max-w-6xl px-2 md:px-4">
      <h1
        class="text-2xl font-semibold tracking-tight text-[var(--text-primary)] md:text-3xl"
      >
        {{ title() }}
      </h1>
      <p
        class="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--text-secondary)]"
      >
        Contenido de esta sección (placeholder). Aquí cargarán las vistas reales.
      </p>
    </section>
  `,
})
export class SectionPlaceholderComponent {
  private readonly route = inject(ActivatedRoute);

  readonly title = toSignal(
    this.route.data.pipe(map((d) => (d['title'] as string) ?? 'Sección')),
    {
      initialValue:
        (this.route.snapshot.data['title'] as string | undefined) ??
        'Sección',
    },
  );
}
