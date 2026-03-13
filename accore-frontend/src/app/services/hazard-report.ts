import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HazardReport, HazardReportStatus } from '../shared/models/hazard-report';

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
