import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import { SocialAuthService } from '@abacritt/angularx-social-login';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private socialAuthService = inject(SocialAuthService, { optional: true });
  private adminLoginUrl = 'http://localhost:5000/api/auth/admin/login';

  login(credentials: any): Observable<any> {
    return this.http.post(this.adminLoginUrl, credentials).pipe(
      tap((response: any) => {
        if (response.token) {
          localStorage.setItem('adminToken', response.token);
        }
      })
    );
  }

  getToken(): string | null {
    return localStorage.getItem('adminToken') || localStorage.getItem('token');
  }

  getRole(): string | null {
    const token = this.getToken();
    if (!token) {
      return null;
    }

    try {
      const decoded: any = jwtDecode(token);
      return decoded.role || null;
    } catch (error) {
      return null;
    }
  }

  logout(): void {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('token');

    // Forcefully revokes the Google session
    if (this.socialAuthService) {
      this.socialAuthService.signOut(true).catch(() => {
        console.log('User was not logged in via Google.');
      });
    }
  }
}