import { InjectionToken } from '@angular/core';

export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL');

/** Dev-only UUID for `/users/:id/...` routes; `null` until you wire real auth. */
export const DEV_USER_ID = new InjectionToken<string | null>('DEV_USER_ID');
