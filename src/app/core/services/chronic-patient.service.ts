import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ChronicPatient {
  id: number;
  full_name: string;
  gender?: string;
  birth_date?: string;
  phone?: string;
  whatsapp?: string;
  disease_name: string;
  notes?: string;
  is_active: boolean;
  created_at?: string;
  medications?: PatientMedication[];
  total_spent?: number;
}

export interface PatientMedication {
  id: number;
  patient_id: number;
  name: string;
  price: number;
  quantity: number;
  total: number;
  payment_method: string;
  consumed_at: string;
  notes?: string;
  image_url?: string;
}

@Injectable({ providedIn: 'root' })
export class ChronicPatientService {
  private api = `${environment.apiUrl}/chronic-patients`;

  constructor(private http: HttpClient) {}

  getAll(params?: { search?: string; status?: string }): Observable<{ status: boolean; data: ChronicPatient[] }> {
    let p = new HttpParams();
    if (params?.search) p = p.set('search', params.search);
    if (params?.status) p = p.set('status', params.status);
    return this.http.get<any>(this.api, { params: p });
  }

  getById(id: number): Observable<{ status: boolean; data: ChronicPatient }> {
    return this.http.get<any>(`${this.api}/${id}`);
  }

  create(data: Partial<ChronicPatient>): Observable<any> {
    return this.http.post<any>(this.api, data);
  }

  update(id: number, data: Partial<ChronicPatient>): Observable<any> {
    return this.http.put<any>(`${this.api}/${id}`, data);
  }

  delete(id: number): Observable<any> {
    return this.http.delete<any>(`${this.api}/${id}`);
  }

  addMedication(patientId: number, formData: FormData): Observable<any> {
    return this.http.post<any>(`${this.api}/${patientId}/medications`, formData);
  }

  removeMedication(patientId: number, medId: number): Observable<any> {
    return this.http.delete<any>(`${this.api}/${patientId}/medications/${medId}`);
  }
}
