/** Supported UI language codes. */
export type AppLang = 'es' | 'en';

/** Menu labels are always shown in each language's native form (not via Transloco). */
export const APP_LANGUAGES: readonly {
  readonly code: AppLang;
  readonly menuLabel: string;
}[] = [
  { code: 'es', menuLabel: 'ES Español' },
  { code: 'en', menuLabel: 'EN English' },
];

export function isAppLang(value: string | null | undefined): value is AppLang {
  return value === 'es' || value === 'en';
}

export const APP_LANG_CODES: readonly AppLang[] = APP_LANGUAGES.map((l) => l.code);
