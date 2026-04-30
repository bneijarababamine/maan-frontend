import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Orphan } from '../models/orphan.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class OrphanService {
  private api = `${environment.apiUrl}/orphans`;

  constructor(private http: HttpClient) {}

  getAll(params?: { search?: string; status?: string; gender?: string }): Observable<{ data: Orphan[] }> {
    let httpParams = new HttpParams();
    if (params?.search) httpParams = httpParams.set('search', params.search);
    if (params?.status) httpParams = httpParams.set('status', params.status);
    if (params?.gender) httpParams = httpParams.set('gender', params.gender);
    return this.http.get<any>(this.api, { params: httpParams }).pipe(
      map(res => ({ data: res.data?.data ?? res.data ?? [] }))
    );
  }

  getById(id: number): Observable<{ data: Orphan }> {
    return this.http.get<any>(`${this.api}/${id}`).pipe(
      map(res => ({ data: res.data }))
    );
  }

  getBenefits(id: number): Observable<any[]> {
    return this.http.get<any>(`${this.api}/${id}/benefits`).pipe(
      map(res => res.data ?? [])
    );
  }

  create(formData: FormData): Observable<{ data: Orphan }> {
    return this.http.post<{ data: Orphan }>(this.api, formData);
  }

  update(id: number, formData: FormData): Observable<{ data: Orphan }> {
    formData.append('_method', 'PUT');
    return this.http.post<{ data: Orphan }>(`${this.api}/${id}`, formData);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }

  addSibling(orphanId: number, siblingId: number): Observable<any> {
    return this.http.post(`${this.api}/${orphanId}/siblings`, { sibling_id: siblingId });
  }

  removeSibling(orphanId: number, siblingId: number): Observable<any> {
    return this.http.delete(`${this.api}/${orphanId}/siblings/${siblingId}`);
  }
}
