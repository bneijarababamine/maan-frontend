import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Donor } from '../models/donor.model';
import { Donation } from '../models/donation.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DonorService {
  private api = `${environment.apiUrl}/donors`;

  constructor(private http: HttpClient) {}

  getAll(params?: { search?: string; is_member?: boolean; gender?: string }): Observable<{ data: Donor[] }> {
    let httpParams = new HttpParams();
    if (params?.search) httpParams = httpParams.set('search', params.search);
    if (params?.is_member !== undefined) httpParams = httpParams.set('is_member', String(params.is_member));
    if (params?.gender) httpParams = httpParams.set('gender', params.gender);
    return this.http.get<any>(this.api, { params: httpParams }).pipe(
      map(res => ({ data: res.data?.data ?? res.data ?? [] }))
    );
  }

  getById(id: number): Observable<{ data: Donor }> {
    return this.http.get<any>(`${this.api}/${id}`).pipe(
      map(res => ({ data: res.data }))
    );
  }

  getDonations(id: number): Observable<Donation[]> {
    return this.http.get<any>(`${this.api}/${id}/donations`).pipe(
      map(res => res.data ?? [])
    );
  }

  create(data: Partial<Donor>): Observable<{ data: Donor }> {
    return this.http.post<{ data: Donor }>(this.api, data);
  }

  update(id: number, data: Partial<Donor>): Observable<{ data: Donor }> {
    return this.http.put<{ data: Donor }>(`${this.api}/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }
}
