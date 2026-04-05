import { provideHttpClient } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';

import { environment } from '../environments/environment';
import { API_BASE_URL, DEV_USER_ID } from './core/config/api.tokens';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(),
    { provide: API_BASE_URL, useValue: environment.apiBaseUrl },
    { provide: DEV_USER_ID, useValue: environment.devUserId },
    provideAnimationsAsync(),
    provideRouter(routes),
  ],
};
