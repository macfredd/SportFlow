import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';

@Component({
  standalone: true,
  selector: 'app-activity-detail-page',
  template: `
    <section class="mx-auto max-w-3xl px-2 md:px-4">
      <h1 class="text-xl font-semibold text-[var(--text-primary)] md:text-2xl">
        Detalle de actividad
      </h1>
      <p class="mt-2 text-sm text-[var(--text-secondary)]">
        ID:
        <code class="rounded bg-[var(--surface)] px-1 py-0.5 text-[var(--text-primary)]">{{
          activityId() ?? '—'
        }}</code>
      </p>
      <p class="mt-4 text-sm text-[var(--text-secondary)]">
        Aquí irá el detalle (mapa, métricas, trackpoints). Por ahora es un marcador de posición.
      </p>
    </section>
  `,
})
export class ActivityDetailPageComponent {
  private readonly route = inject(ActivatedRoute);

  readonly activityId = toSignal(
    this.route.paramMap.pipe(map((p) => p.get('activityId'))),
    { initialValue: null },
  );
}
