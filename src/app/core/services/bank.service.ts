import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Bank } from '../models/bank.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class BankService {
  private api = `${environment.apiUrl}/banks`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<{ data: Bank[] }> {
    return this.http.get<{ data: Bank[] }>(this.api);
  }

  create(data: Partial<Bank>): Observable<{ data: Bank }> {
    return this.http.post<{ data: Bank }>(this.api, data);
  }

  update(id: number, data: Partial<Bank>): Observable<{ data: Bank }> {
    return this.http.put<{ data: Bank }>(`${this.api}/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }
}
