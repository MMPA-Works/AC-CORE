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
  private readonly ADMIN_TOKEN_KEY = 'adminToken';
  private readonly CITIZEN_TOKEN_KEY = 'token';

  login(credentials: any): Observable<any> {
    return this.http.post(this.adminLoginUrl, credentials).pipe(
      tap((response: any) => {
        if (response.token) {
          localStorage.removeItem(this.CITIZEN_TOKEN_KEY);
          localStorage.setItem(this.ADMIN_TOKEN_KEY, response.token);
        }
      })
    );
  }

  getAdminToken(): string | null {
    return localStorage.getItem(this.ADMIN_TOKEN_KEY);
  }

  getCitizenToken(): string | null {
    return localStorage.getItem(this.CITIZEN_TOKEN_KEY);
  }

  getToken(scope: 'admin' | 'citizen' | 'any' = 'any'): string | null {
    if (scope === 'admin') {
      return this.getAdminToken();
    }

    if (scope === 'citizen') {
      return this.getCitizenToken();
    }

    return this.getAdminToken() || this.getCitizenToken();
  }

  private decodeToken(token: string | null): any | null {
    if (!token) {
      return null;
    }

    try {
      return jwtDecode(token);
    } catch (error) {
      return null;
    }
  }

  getRole(scope: 'admin' | 'citizen' | 'any' = 'any'): string | null {
    const decoded = this.decodeToken(this.getToken(scope));
    return decoded?.role || null;
  }

  getUserId(scope: 'admin' | 'citizen' | 'any' = 'any'): string | null {
    const decoded = this.decodeToken(this.getToken(scope));
    return decoded?.id || null;
  }

  getFirstName(scope: 'admin' | 'citizen' | 'any' = 'any'): string | null {
    const decoded = this.decodeToken(this.getToken(scope));
    return decoded?.firstName || null;
  }

  logout(): void {
    localStorage.removeItem(this.ADMIN_TOKEN_KEY);
    localStorage.removeItem(this.CITIZEN_TOKEN_KEY);

    // Forcefully revokes the Google session
    if (this.socialAuthService) {
      this.socialAuthService.signOut(true).catch(() => {
        console.log('User was not logged in via Google.');
      });
    }
  }
}
