import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Donation } from '../models/donation.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DonationService {
  private api = `${environment.apiUrl}/donations`;

  constructor(private http: HttpClient) {}

  getAll(params?: { donor_id?: number; search?: string }): Observable<{ data: Donation[] }> {
    let httpParams = new HttpParams();
    if (params?.donor_id) httpParams = httpParams.set('donor_id', String(params.donor_id));
    if (params?.search) httpParams = httpParams.set('search', params.search);
    return this.http.get<any>(this.api, { params: httpParams }).pipe(
      map(res => ({ data: res.data?.data ?? res.data ?? [] }))
    );
  }

  getById(id: number): Observable<{ data: Donation }> {
    return this.http.get<{ data: Donation }>(`${this.api}/${id}`);
  }

  store(formData: FormData): Observable<{ data: Donation }> {
    return this.http.post<{ data: Donation }>(this.api, formData);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }
}
