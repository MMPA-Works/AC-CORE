import { Routes } from '@angular/router';
import { AuthGuard } from '../shared/auth.guard';
import { LegalLayout } from './legal/legal-layout';

export const CITIZEN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./home/home').then(m => m.Home),
    data: { title: 'Home' },
  },
  {
    path: 'login',
    loadComponent: () => import('./login/login').then(m => m.Login),
    data: { title: 'Login' },
  },
  {
    path: 'signup',
    loadComponent: () => import('./signup/signup').then(m => m.Signup),
    data: { title: 'Sign Up' },
  },
  {
    path: 'report',
    loadComponent: () => import('./report/report').then(m => m.Report),
    data: { title: 'Report a Hazard' },
  },
  { 
    path: 'directory', 
    loadComponent: () => import('./directory/directory').then(m => m.Directory),
    data: { title: 'Emergency Directory' },
  },
  {
    path: '',
    component: LegalLayout,
    children: [
      { 
        path: 'privacy', 
        loadComponent: () => import('./legal/privacy').then(m => m.PrivacyComponent),
        data: { title: 'Privacy Policy' },
      },
      { 
        path: 'terms', 
        loadComponent: () => import('./legal/terms').then(m => m.TermsComponent),
        data: { title: 'Terms of Service' },
      },
      { 
        // Updated path and component name
        path: 'tracking', 
        loadComponent: () => import('./legal/tracking').then(m => m.TrackingComponent),
        data: { title: 'Tracking & Local Storage Policy' },
      }
    ]
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard').then(m => m.Dashboard),
    canActivate: [AuthGuard],
    data: { title: 'Dashboard' },
  },
  {
    path: 'my-reports',
    loadComponent: () => import('./my-reports/my-reports').then(m => m.MyReports),
    canActivate: [AuthGuard],
    data: { title: 'My Reports' },
  },
  {
    path: 'my-reports/:id',
    loadComponent: () => import('./report-details/report-details').then(m => m.ReportDetails),
    canActivate: [AuthGuard],
    data: { title: 'Report Details' },
  },
];