import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';

import { API_BASE_URL, DEV_USER_ID } from '../../../core/config/api.tokens';
import type {
  ActivitiesBySportType,
  Activity,
  ActivityDetailSummary,
  LastActivitySummary,
} from '../../../shared/models/activity.model';

@Injectable({ providedIn: 'root' })
export class ActivitiesApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly userId = inject(DEV_USER_ID);

  private requireUserId(): string {
    if (!this.userId) {
      throw new Error('DEV_USER_ID is not configured.');
    }
    return this.userId;
  }

  list(): Observable<Activity[]> {
    const userId = this.requireUserId();
    return this.http.get<Activity[]>(`${this.baseUrl}/users/${userId}/activities`);
  }

  getLastActivity(): Observable<LastActivitySummary> {
    const userId = this.requireUserId();
    return this.http.get<LastActivitySummary>(`${this.baseUrl}/users/${userId}/activities/latest`);
  }

  getActivityById(activityId: string): Observable<ActivityDetailSummary> {
    const userId = this.requireUserId();
    return this.http.get<ActivityDetailSummary>(
      `${this.baseUrl}/users/${userId}/activities/${activityId}`,
    );
  }

  getTotalActivitiesBySportType(days: number | null): Observable<ActivitiesBySportType[]> {
    const userId = this.requireUserId();
    const url = `${this.baseUrl}/users/${userId}/activities/total-by-sport-type`;
    let params = new HttpParams();
    if (days !== null) {
      params = params.set('days', String(days));
    }
    return this.http.get<ActivitiesBySportType[]>(url, { params });
  }
}
