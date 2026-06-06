import { type Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { type TranslocoService } from '@ngneat/transloco';
import { map, startWith, switchMap } from 'rxjs/operators';

/**
 * Signal that updates when the active language bundle is ready.
 * Read inside a `computed` (e.g. `this.langTick()`) so ECharts options rebuild
 * only after `transloco.translate()` can resolve strings (not raw keys).
 */
export function createTranslocoLangTick(transloco: TranslocoService): Signal<string> {
  return toSignal(
    transloco.langChanges$.pipe(
      startWith(transloco.getActiveLang()),
      switchMap((lang) => transloco.load(lang)),
      map(() => transloco.getActiveLang()),
    ),
    { initialValue: transloco.getActiveLang() },
  );
}
