import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface DashboardStats {
  total_members: number;
  active_members: number;
  total_orphans: number;
  active_orphans: number;
  near_18_orphans: number;
  total_families: number;
  active_families: number;
  monthly_contributions: number;
  monthly_donations: number;
  monthly_total: number;
}

export interface RevenueData {
  month: string;
  contributions: number;
  donations: number;
}

export interface TreasuryData {
  total: number;
  cash: number;
  bankily: number;
  sadad: number;
  masrafi: number;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private api = `${environment.apiUrl}/dashboard`;

  constructor(private http: HttpClient) {}

  getStats(): Observable<{ data: DashboardStats }> {
    return this.http.get<{ data: DashboardStats }>(`${this.api}/stats`);
  }

  getRevenueChart(): Observable<{ data: RevenueData[] }> {
    return this.http.get<{ data: RevenueData[] }>(`${this.api}/revenue`);
  }

  getUnpaidMembers(): Observable<{ data: any[] }> {
    return this.http.get<{ data: any[] }>(`${this.api}/unpaid-members`);
  }

  getNear18Orphans(): Observable<{ data: any[] }> {
    return this.http.get<{ data: any[] }>(`${this.api}/near-18-orphans`);
  }

  getRecentActivities(): Observable<{ data: any[] }> {
    return this.http.get<{ data: any[] }>(`${this.api}/recent-activities`);
  }

  getTreasury(): Observable<{ data: TreasuryData }> {
    return this.http.get<{ data: TreasuryData }>(`${this.api}/treasury`);
  }
}
