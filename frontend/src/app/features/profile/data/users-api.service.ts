import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { API_BASE_URL, DEV_USER_ID } from '../../../core/config/api.tokens';
import { UserProfile } from '../../../shared/models/user-profile.model';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UsersApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly userId = inject(DEV_USER_ID);

  private requireUserId(): string {
    if (!this.userId) {
      throw new Error('DEV_USER_ID is not configured.');
    }
    return this.userId;
  }
  
  getUserProfile(): Observable<UserProfile> {
    const userId = this.requireUserId();
    return this.http.get<UserProfile>(`${this.baseUrl}/users/${userId}`);
  }
}