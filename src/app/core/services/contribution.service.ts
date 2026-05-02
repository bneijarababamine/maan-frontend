import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Contribution } from '../models/contribution.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ContributionService {
  private api = `${environment.apiUrl}/contributions`;

  constructor(private http: HttpClient) {}

  getAll(params?: { member_id?: number; search?: string; payment_method?: string }): Observable<{ data: Contribution[] }> {
    let httpParams = new HttpParams();
    if (params?.member_id) httpParams = httpParams.set('member_id', String(params.member_id));
    if (params?.search) httpParams = httpParams.set('search', params.search);
    if (params?.payment_method) httpParams = httpParams.set('payment_method', params.payment_method);
    return this.http.get<any>(this.api, { params: httpParams }).pipe(
      map(res => ({ data: res.data?.data ?? res.data ?? [] }))
    );
  }

  getById(id: number): Observable<{ data: Contribution }> {
    return this.http.get<{ data: Contribution }>(`${this.api}/${id}`);
  }

  store(formData: FormData): Observable<{ data: Contribution }> {
    return this.http.post<{ data: Contribution }>(this.api, formData);
  }

  update(id: number, formData: FormData): Observable<{ data: Contribution }> {
    return this.http.post<{ data: Contribution }>(`${this.api}/${id}?_method=PUT`, formData);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }
}
