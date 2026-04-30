import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private api = `${environment.apiUrl}/settings`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<{ data: Record<string, string> }> {
    return this.http.get<{ data: Record<string, string> }>(this.api);
  }

  set(key: string, value: string): Observable<any> {
    return this.http.post(this.api, { key, value });
  }
}
