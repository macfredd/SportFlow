import { inject } from '@angular/core';
import { getBrowserLang, TranslocoService } from '@ngneat/transloco';

import { APP_LANG_STORAGE_KEY } from './lang-storage';

function resolveInitialLang(): 'es' | 'en' {
  try {
    const stored = localStorage.getItem(APP_LANG_STORAGE_KEY);
    if (stored === 'en' || stored === 'es') {
      return stored;
    }
  } catch {
    /* ignore */
  }
  const browser = getBrowserLang()?.toLowerCase() ?? '';
  return browser.startsWith('en') ? 'en' : 'es';
}

/** Used with {@link provideAppInitializer} (runs in an injection context). */
export function initAppLanguage(): void {
  inject(TranslocoService).setActiveLang(resolveInitialLang());
}
