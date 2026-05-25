import { type Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { type TranslocoService, type TranslocoEvents } from '@ngneat/transloco';
import { merge } from 'rxjs';
import { filter, map, startWith } from 'rxjs/operators';

/**
 * Signal that updates when the active language or translation bundle changes.
 * Read inside a `computed` (e.g. `this.langTick()`) so ECharts options rebuild
 * after `transloco.translate()` in chart formatters.
 */
export function createTranslocoLangTick(transloco: TranslocoService): Signal<string> {
  return toSignal(
    merge(
      transloco.langChanges$,
      transloco.events$.pipe(
        filter(
          (e: TranslocoEvents) => e.type === 'translationLoadSuccess' && !e.wasFailure,
        ),
      ),
    ).pipe(
      map(() => transloco.getActiveLang()),
      startWith(transloco.getActiveLang()),
    ),
    { initialValue: transloco.getActiveLang() },
  );
}
