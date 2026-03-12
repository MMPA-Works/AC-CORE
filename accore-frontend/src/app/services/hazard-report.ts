import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  HazardReport,
  HazardReportPageQuery,
  HazardReportStatus,
  PaginatedHazardReportResponse,
} from '../shared/models/hazard-report';

@Injectable({
  providedIn: 'root'
})
export class HazardReportService {
  private apiUrl = 'http://localhost:5000/api/reports';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }

  submitReport(formData: FormData): Observable<HazardReport> {
    return this.http.post<HazardReport>(this.apiUrl, formData, {
      headers: this.getAuthHeaders()
    });
  }

  getReports(): Observable<HazardReport[]> {
    return this.http.get<HazardReport[]>(this.apiUrl, {
      headers: this.getAuthHeaders()
    });
  }

  getReportsPage(query: HazardReportPageQuery): Observable<PaginatedHazardReportResponse> {
    let params = new HttpParams()
      .set('page', query.page.toString())
      .set('limit', query.limit.toString());

    if (query.barangay && query.barangay !== 'All') {
      params = params.set('barangay', query.barangay);
    }

    if (query.category && query.category !== 'All') {
      params = params.set('category', query.category);
    }

    if (query.severity && query.severity !== 'All') {
      params = params.set('severity', query.severity);
    }

    if (query.status && query.status !== 'All') {
      params = params.set('status', query.status);
    }

    if (query.sortColumn) {
      params = params.set('sortColumn', query.sortColumn);
    }

    if (query.sortDirection) {
      params = params.set('sortDirection', query.sortDirection);
    }

    return this.http.get<PaginatedHazardReportResponse>(this.apiUrl, {
      headers: this.getAuthHeaders(),
      params,
    });
  }

  getAnalytics(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/analytics`, {
      headers: this.getAuthHeaders()
    });
  }

  getReportById(id: string): Observable<HazardReport> {
    return this.http.get<HazardReport>(`${this.apiUrl}/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  updateReportStatus(id: string, status: HazardReportStatus): Observable<HazardReport> {
    return this.http.put<HazardReport>(`${this.apiUrl}/${id}/status`, { status }, {
      headers: this.getAuthHeaders()
    });
  }
}
