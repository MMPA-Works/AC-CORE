import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import { SocialAuthService } from '@abacritt/angularx-social-login';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private socialAuthService = inject(SocialAuthService, { optional: true });
  private adminLoginUrl = `${environment.apiUrl}/auth/admin/login`;
  private readonly ADMIN_TOKEN_KEY = 'adminToken';
  private readonly CITIZEN_TOKEN_KEY = 'token';

  login(credentials: any): Observable<any> {
    return this.http.post(this.adminLoginUrl, credentials).pipe(
      tap((response: any) => {
        if (response.token) {
          localStorage.removeItem(this.CITIZEN_TOKEN_KEY);
          sessionStorage.removeItem(this.CITIZEN_TOKEN_KEY); // Clear session too
          localStorage.setItem(this.ADMIN_TOKEN_KEY, response.token);
        }
      })
    );
  }

  // FIX: Check both localStorage and sessionStorage
  getAdminToken(): string | null {
    return localStorage.getItem(this.ADMIN_TOKEN_KEY) || sessionStorage.getItem(this.ADMIN_TOKEN_KEY);
  }

  // FIX: Check both localStorage and sessionStorage
  getCitizenToken(): string | null {
    return localStorage.getItem(this.CITIZEN_TOKEN_KEY) || sessionStorage.getItem(this.CITIZEN_TOKEN_KEY);
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
    // FIX: Clear everything on logout
    localStorage.removeItem(this.ADMIN_TOKEN_KEY);
    localStorage.removeItem(this.CITIZEN_TOKEN_KEY);
    sessionStorage.removeItem(this.ADMIN_TOKEN_KEY);
    sessionStorage.removeItem(this.CITIZEN_TOKEN_KEY);

    // Forcefully revokes the Google session
    if (this.socialAuthService) {
      this.socialAuthService.signOut(true).catch(() => {
        console.log('User was not logged in via Google.');
      });
    }
  }
}