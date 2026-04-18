import { provideHttpClient } from '@angular/common/http';
import {
  ApplicationConfig,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { provideTransloco } from '@ngneat/transloco';

import { environment } from '../environments/environment';
import { API_BASE_URL, DEV_USER_ID } from './core/config/api.tokens';
import { routes } from './app.routes';
import { initAppLanguage } from './core/i18n/app-lang.init';
import { TranslocoHttpLoader } from './core/i18n/transloco-http.loader';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(),
    { provide: API_BASE_URL, useValue: environment.apiBaseUrl },
    { provide: DEV_USER_ID, useValue: environment.devUserId },
    provideAnimations(),
    provideRouter(routes),
    ...provideTransloco({
      config: {
        availableLangs: ['es', 'en'],
        defaultLang: 'es',
        fallbackLang: 'es',
        reRenderOnLangChange: true,
        prodMode: environment.production,
      },
      loader: TranslocoHttpLoader,
    }),
    provideAppInitializer(initAppLanguage),
  ],
};
