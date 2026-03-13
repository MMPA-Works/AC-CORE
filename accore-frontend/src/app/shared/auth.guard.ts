import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth';

export const AuthGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const isAdminRoute = state.url.startsWith('/admin');

  const token = authService.getToken(isAdminRoute ? 'admin' : 'citizen');
  const role = authService.getRole(isAdminRoute ? 'admin' : 'citizen');
  const alternateRole = authService.getRole(isAdminRoute ? 'citizen' : 'admin');

  console.log('--- AuthGuard Security Check ---');
  console.log('Target URL:', state.url);
  console.log('Token found:', !!token);
  console.log('Role extracted:', role);

  if (!token || !role) {
    console.warn('Access Denied: Missing token or role. Redirecting to login.');
    if (isAdminRoute && alternateRole === 'citizen') {
      router.navigate(['/citizen/dashboard']);
    } else if (!isAdminRoute && alternateRole === 'admin') {
      router.navigate(['/admin/dashboard']);
    } else if (isAdminRoute) {
      router.navigate(['/admin/login']);
    } else {
      router.navigate(['/login']);
    }
    return false;
  }

  if (isAdminRoute && role !== 'admin') {
    console.warn('Access Denied: Not an admin. Redirecting to citizen dashboard.');
    router.navigate(['/citizen/dashboard']);
    return false;
  }

  if (!isAdminRoute && role !== 'citizen') {
    console.warn('Access Denied: Not a citizen. Redirecting to admin dashboard.');
    router.navigate(['/admin/dashboard']); 
    return false;
  }

  console.log('Access Granted!');
  return true;
};
