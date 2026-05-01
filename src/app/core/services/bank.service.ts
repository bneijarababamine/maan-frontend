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

  create(data: Partial<Bank>, logoFile?: File): Observable<{ data: Bank }> {
    if (logoFile) {
      const fd = this.toFormData(data);
      fd.append('logo', logoFile);
      return this.http.post<{ data: Bank }>(this.api, fd);
    }
    return this.http.post<{ data: Bank }>(this.api, data);
  }

  update(id: number, data: Partial<Bank>, logoFile?: File): Observable<{ data: Bank }> {
    if (logoFile) {
      const fd = this.toFormData(data);
      fd.append('logo', logoFile);
      fd.append('_method', 'PUT');
      return this.http.post<{ data: Bank }>(`${this.api}/${id}`, fd);
    }
    return this.http.put<{ data: Bank }>(`${this.api}/${id}`, data);
  }

  private toFormData(data: Partial<Bank>): FormData {
    const fd = new FormData();
    Object.entries(data).forEach(([k, v]) => {
      if (v !== null && v !== undefined) {
        fd.append(k, typeof v === 'boolean' ? (v ? '1' : '0') : String(v));
      }
    });
    return fd;
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }
}
