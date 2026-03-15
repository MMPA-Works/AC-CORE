import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BarangayService { 
  private apiUrl = `${environment.apiUrl}/geospatial/nearest-barangay`;

  constructor(private http: HttpClient) {}

  getNearestBarangay(longitude: number, latitude: number): Observable<any> {
    const params = new HttpParams()
      .set('longitude', longitude.toString())
      .set('latitude', latitude.toString());

    return this.http.get<any>(this.apiUrl, { 
      params: params 
    });
  }
}