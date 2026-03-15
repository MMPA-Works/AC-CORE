import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  HazardReport,
  HazardReportPageQuery,
  HazardReportStatus,
  PaginatedHazardReportResponse,
} from '../shared/models/hazard-report';
import { AuthService } from '../shared/auth';

@Injectable({
  providedIn: 'root',
})
export class HazardReportService {
  private apiUrl = `${environment.apiUrl}/reports`;
  private authService = inject(AuthService);

  constructor(private http: HttpClient) {}

  private getCitizenToken(): string | null {
    return this.authService.getCitizenToken();
  }

  private getStoredToken(): string | null {
    return this.authService.getToken();
  }

  private getAuthHeaders(token = this.getStoredToken()): HttpHeaders {
    if (!token) {
      return new HttpHeaders();
    }

    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
  }

  submitReport(formData: FormData): Observable<HazardReport> {
    const citizenToken = this.getCitizenToken();
    const targetUrl = citizenToken ? this.apiUrl : `${this.apiUrl}/guest`;

    return this.http.post<HazardReport>(targetUrl, formData, {
      headers: this.getAuthHeaders(citizenToken),
    });
  }

  getReports(): Observable<HazardReport[]> {
    return this.http.get<HazardReport[]>(this.apiUrl, {
      headers: this.getAuthHeaders(),
    });
  }

  getDownstreamRisks(): Observable<Record<string, HazardReport[]>> {
    return this.http.get<Record<string, HazardReport[]>>(
      `${this.apiUrl}/downstream-risks`,
      { headers: this.getAuthHeaders() }
    );
  }

  // Fetches public map markers without requiring admin privileges
  getAllPublicReports(): Observable<HazardReport[]> {
    return this.http.get<HazardReport[]>(`${this.apiUrl}/public`, {
      headers: this.getAuthHeaders(),
    });
  }

  getReportsPage(query: HazardReportPageQuery): Observable<PaginatedHazardReportResponse> {
    let params = new HttpParams()
      .set('page', query.page.toString())
      .set('limit', query.limit.toString());

    if (query.archived) {
      params = params.set('archived', query.archived);
    }

    if (query.search) {
      params = params.set('search', query.search);
    }

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
      headers: this.getAuthHeaders(),
    });
  }

  getReportById(id: string): Observable<HazardReport> {
    return this.http.get<HazardReport>(`${this.apiUrl}/${id}`, {
      headers: this.getAuthHeaders(),
    });
  }

  updateReportStatus(id: string, status: HazardReportStatus): Observable<HazardReport> {
    return this.http.put<HazardReport>(
      `${this.apiUrl}/${id}/status`,
      { status },
      {
        headers: this.getAuthHeaders(),
      },
    );
  }

  archiveReport(id: string): Observable<HazardReport> {
    return this.http.put<HazardReport>(
      `${this.apiUrl}/${id}/archive`,
      {},
      {
        headers: this.getAuthHeaders(),
      },
    );
  }

  toggleVerify(id: string) {
    return this.http.patch(
      `${this.apiUrl}/${id}/verify`,
      {},
      {
        headers: this.getAuthHeaders(),
      },
    );
  }
}
