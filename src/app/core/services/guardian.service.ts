import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface Guardian {
  id: number;
  name: string;
  father_name?: string;
  phone: string;
  whatsapp?: string;
  address?: string;
  notes?: string;
  is_active: boolean;
  orphans_count?: number;
  orphans?: any[];
  created_at?: string;
  updated_at?: string;
}

@Injectable({ providedIn: 'root' })
export class GuardianService {
  private api = `${environment.apiUrl}/guardians`;

  constructor(private http: HttpClient) {}

  getAll(params?: { search?: string; status?: string }): Observable<{ data: Guardian[] }> {
    let httpParams = new HttpParams();
    if (params?.search) httpParams = httpParams.set('search', params.search);
    if (params?.status) httpParams = httpParams.set('status', params.status);
    return this.http.get<any>(this.api, { params: httpParams }).pipe(
      map(res => ({ data: res.data?.data ?? res.data ?? [] }))
    );
  }

  getById(id: number): Observable<{ data: Guardian }> {
    return this.http.get<any>(`${this.api}/${id}`).pipe(
      map(res => ({ data: res.data }))
    );
  }

  checkByPhone(phone: string): Observable<{ exists: boolean; data: Guardian | null }> {
    return this.http.post<any>(`${this.api}/check-phone`, { phone }).pipe(
      map(res => ({
        exists: res.exists,
        data: res.data
      }))
    );
  }

  create(data: Partial<Guardian>): Observable<{ data: Guardian }> {
    return this.http.post<{ data: Guardian }>(this.api, data);
  }

  update(id: number, data: Partial<Guardian>): Observable<{ data: Guardian }> {
    return this.http.put<{ data: Guardian }>(`${this.api}/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }

  getOrphans(id: number): Observable<any[]> {
    return this.http.get<any>(`${this.api}/${id}/orphans`).pipe(
      map(res => res.data ?? [])
    );
  }
}
