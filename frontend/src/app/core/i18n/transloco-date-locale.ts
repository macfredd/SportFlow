/**
 * Locale id for Angular `DatePipe` / `formatDate`, aligned with `registerLocaleData` in `main.ts`.
 */
export function translocoLangToDateLocale(lang: string): string {
  const base = lang.split('-')[0]?.toLowerCase() ?? 'en';
  return base === 'es' ? 'es' : 'en';
}
