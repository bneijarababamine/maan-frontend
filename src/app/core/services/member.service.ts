import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Member, UnpaidMonth } from '../models/member.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class MemberService {
  private api = `${environment.apiUrl}/members`;

  constructor(private http: HttpClient) {}

  getAll(params?: { search?: string; is_active?: boolean; filter?: string; gender?: string }): Observable<{ data: Member[] }> {
    let httpParams = new HttpParams();
    if (params?.search) httpParams = httpParams.set('search', params.search);
    if (params?.is_active !== undefined) httpParams = httpParams.set('is_active', String(params.is_active));
    if (params?.filter) httpParams = httpParams.set('filter', params.filter);
    if (params?.gender) httpParams = httpParams.set('gender', params.gender);
    return this.http.get<any>(this.api, { params: httpParams }).pipe(
      map(res => ({ data: res.data?.data ?? res.data ?? [] }))
    );
  }

  getById(id: number): Observable<{ data: Member }> {
    return this.http.get<{ data: Member }>(`${this.api}/${id}`);
  }

  create(data: Partial<Member>): Observable<{ data: Member }> {
    return this.http.post<{ data: Member }>(this.api, data);
  }

  update(id: number, data: Partial<Member>): Observable<{ data: Member }> {
    return this.http.put<{ data: Member }>(`${this.api}/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }

  getMemberContributions(id: number): Observable<{ data: any[] }> {
    return this.http.get<any>(`${this.api}/${id}/contributions`).pipe(
      map(res => ({ data: res.data?.data ?? res.data ?? [] }))
    );
  }

  getUnpaidMonths(id: number): Observable<{ data: UnpaidMonth[] }> {
    return this.http.get<{ data: UnpaidMonth[] }>(`${this.api}/${id}/unpaid-months`);
  }

  getPaidMonths(id: number): Observable<{ data: UnpaidMonth[] }> {
    return this.http.get<{ data: UnpaidMonth[] }>(`${this.api}/${id}/paid-months`);
  }
}
