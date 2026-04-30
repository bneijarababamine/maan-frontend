import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Wilaya {
  id: number;
  name_fr: string;
  name_ar: string;
  is_active: boolean;
}

@Injectable({ providedIn: 'root' })
export class WilayaService {
  private api = `${environment.apiUrl}/wilayas`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<{ data: Wilaya[] }> {
    return this.http.get<{ data: Wilaya[] }>(this.api);
  }

  create(data: { name_fr: string; name_ar: string }): Observable<{ data: Wilaya }> {
    return this.http.post<{ data: Wilaya }>(this.api, data);
  }

  update(id: number, data: Partial<Wilaya>): Observable<{ data: Wilaya }> {
    return this.http.put<{ data: Wilaya }>(`${this.api}/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }
}
