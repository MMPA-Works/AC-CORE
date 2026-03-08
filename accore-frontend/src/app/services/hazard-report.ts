import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class HazardReportService {
  private apiUrl = 'http://localhost:5000/api/reports';

  constructor(private http: HttpClient) {}

  submitReport(formData: FormData): Observable<any> {
    return this.http.post(this.apiUrl, formData);
  }

  getReports(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }
}