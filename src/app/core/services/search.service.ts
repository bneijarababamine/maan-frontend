import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface SearchResult {
  guardians: SearchPerson[];
  orphans:   SearchPerson[];
  members:   SearchPerson[];
  donors:    SearchPerson[];
  families:  SearchPerson[];
}

export interface SearchPerson {
  type:               string;
  id:                 number;
  name:               string;
  full_name?:         string;
  father_name?:       string;
  head_of_family?:    string;
  phone?:             string;
  whatsapp?:          string;
  is_active?:         boolean;
  gender?:            string;
  age?:               number;
  guardian_id?:       number;
  guardian_name?:     string;
  orphans_count?:     number;
  members_count?:     number;
  activity_benefits:  ActivityBenefit[];
  contributions?:     Contribution[];
  donations?:         Donation[];
  orphans?:           any[];
}

export interface ActivityBenefit {
  activity_id:    number;
  activity_title: string;
  activity_date:  string;
  activity_type:  string;
  payment_type:   string;
  value_received?: number;
  total_received?: number;
  orphan_count?:  number;
}

export interface Contribution {
  id:             number;
  total_amount:   number;
  months_count:   number;
  paid_at:        string;
  payment_method: string;
}

export interface Donation {
  id:             number;
  amount:         number;
  donated_at:     string;
  payment_method: string;
}

@Injectable({ providedIn: 'root' })
export class SearchService {
  private api = `${environment.apiUrl}/search`;

  constructor(private http: HttpClient) {}

  search(q: string): Observable<{ status: boolean; data: SearchResult }> {
    return this.http.get<any>(this.api, { params: { q } });
  }
}
