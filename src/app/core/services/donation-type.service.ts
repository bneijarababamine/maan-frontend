import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DonationType } from '../models/donation.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DonationTypeService {
  private api = `${environment.apiUrl}/donation-types`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<{ data: DonationType[] }> {
    return this.http.get<{ data: DonationType[] }>(this.api);
  }

  create(data: Partial<DonationType>): Observable<{ data: DonationType }> {
    return this.http.post<{ data: DonationType }>(this.api, data);
  }

  update(id: number, data: Partial<DonationType>): Observable<{ data: DonationType }> {
    return this.http.put<{ data: DonationType }>(`${this.api}/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }
}
