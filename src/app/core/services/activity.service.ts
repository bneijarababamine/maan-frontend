import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Activity, ActivityBeneficiary, ActivityItem } from '../models/activity.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ActivityService {
  private api = `${environment.apiUrl}/activities`;

  constructor(private http: HttpClient) {}

  getAll(params?: { activity_type?: string; search?: string }): Observable<{ data: Activity[] }> {
    let httpParams = new HttpParams();
    if (params?.activity_type) httpParams = httpParams.set('activity_type', params.activity_type);
    if (params?.search) httpParams = httpParams.set('search', params.search);
    return this.http.get<any>(this.api, { params: httpParams }).pipe(
      map(res => ({ data: res.data?.data ?? res.data ?? [] }))
    );
  }

  getById(id: number): Observable<{ data: Activity }> {
    return this.http.get<{ data: Activity }>(`${this.api}/${id}`);
  }

  create(formData: FormData): Observable<{ data: Activity }> {
    return this.http.post<{ data: Activity }>(this.api, formData);
  }

  update(id: number, formData: FormData): Observable<{ data: Activity }> {
    formData.append('_method', 'PUT');
    return this.http.post<{ data: Activity }>(`${this.api}/${id}`, formData);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }

  addPhoto(activityId: number, formData: FormData): Observable<any> {
    return this.http.post(`${this.api}/${activityId}/photos`, formData);
  }

  deletePhoto(activityId: number, photoId: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/${activityId}/photos/${photoId}`);
  }

  addBeneficiary(activityId: number, data: Partial<ActivityBeneficiary>): Observable<any> {
    return this.http.post(`${this.api}/${activityId}/beneficiaries`, { beneficiaries: [data] });
  }

  removeBeneficiary(activityId: number, beneficiaryId: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/${activityId}/beneficiaries/${beneficiaryId}`);
  }

  addItems(activityId: number, items: Partial<ActivityItem>[]): Observable<any> {
    return this.http.post(`${this.api}/${activityId}/items`, { items });
  }

  removeItem(activityId: number, itemId: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/${activityId}/items/${itemId}`);
  }
}
