import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Family } from '../models/family.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class FamilyService {
  private api = `${environment.apiUrl}/families`;

  constructor(private http: HttpClient) {}

  getAll(params?: { search?: string; is_active?: boolean }): Observable<{ data: Family[] }> {
    let httpParams = new HttpParams();
    if (params?.search) httpParams = httpParams.set('search', params.search);
    if (params?.is_active !== undefined) httpParams = httpParams.set('is_active', String(params.is_active));
    return this.http.get<any>(this.api, { params: httpParams }).pipe(
      map(res => ({ data: res.data?.data ?? res.data ?? [] }))
    );
  }

  getById(id: number): Observable<{ data: Family }> {
    return this.http.get<{ data: Family }>(`${this.api}/${id}`);
  }

  create(data: Partial<Family>): Observable<{ data: Family }> {
    return this.http.post<{ data: Family }>(this.api, data);
  }

  update(id: number, data: Partial<Family>): Observable<{ data: Family }> {
    return this.http.put<{ data: Family }>(`${this.api}/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }
}
