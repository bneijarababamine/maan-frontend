import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BankTransfer } from '../models/bank-transfer.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class BankTransferService {
  private api = `${environment.apiUrl}/bank-transfers`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<{ data: { data: BankTransfer[] } }> {
    return this.http.get<any>(this.api);
  }

  create(data: { from_bank_id: number; to_bank_id: number; amount: number; notes?: string }): Observable<{ data: BankTransfer }> {
    return this.http.post<{ data: BankTransfer }>(this.api, data);
  }

  update(id: number, data: { from_bank_id: number; to_bank_id: number; amount: number; notes?: string }): Observable<{ data: BankTransfer }> {
    return this.http.put<{ data: BankTransfer }>(`${this.api}/${id}`, data);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.api}/${id}`);
  }
}
