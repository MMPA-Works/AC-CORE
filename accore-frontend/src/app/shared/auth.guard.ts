import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth';

export const AuthGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const token = authService.getToken();
  const role = authService.getRole();

  console.log('--- AuthGuard Security Check ---');
  console.log('Target URL:', state.url);
  console.log('Token found:', !!token);
  console.log('Role extracted:', role);

  if (!token || !role) {
    console.warn('Access Denied: Missing token or role. Redirecting to login.');
    if (state.url.startsWith('/admin')) {
      router.navigate(['/admin/login']);
    } else {
      router.navigate(['/login']);
    }
    return false;
  }

  if (state.url.startsWith('/admin') && role !== 'admin') {
    console.warn('Access Denied: Not an admin. Redirecting to citizen dashboard.');
    router.navigate(['/dashboard']);
    return false;
  }

  if (state.url.startsWith('/dashboard') && role !== 'citizen') {
    console.warn('Access Denied: Not a citizen. Redirecting to admin dashboard.');
    router.navigate(['/admin/dashboard']); 
    return false;
  }

  console.log('Access Granted!');
  return true;
};