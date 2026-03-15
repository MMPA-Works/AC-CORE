import { Routes } from '@angular/router';
import { Home } from './home/home';
import { Login } from './login/login';
import { Signup } from './signup/signup';
import { Dashboard } from './dashboard/dashboard';
import { Report } from './report/report';
import { MyReports } from './my-reports/my-reports';
import { ReportDetails } from './report-details/report-details';
import { Directory } from './directory/directory';
import { AuthGuard } from '../shared/auth.guard';
import { LegalLayout } from './legal/legal-layout';

export const CITIZEN_ROUTES: Routes = [
  // Public Landing & Auth
  {
    path: '',
    component: Home,
    data: { title: 'Home' },
  },
  {
    path: 'login',
    component: Login,
    data: { title: 'Login' },
  },
  {
    path: 'signup',
    component: Signup,
    data: { title: 'Sign Up' },
  },
  {
    path: 'report',
    component: Report,
    data: { title: 'Report a Hazard' },
  },
  { 
    path: 'directory', 
    component: Directory,
    data: { title: 'Emergency Directory' },
  },

  // Legal Pages (Wrapped in LegalLayout for Header/Footer)
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
        data: { title: 'Terms and Conditions' },
      },
      { 
        path: 'cookies', 
        loadComponent: () => import('./legal/cookies').then(m => m.CookiesComponent),
        data: { title: 'Cookie Policy' },
      }
    ]
  },

  // Protected Routes (Require Login)
  {
    path: 'dashboard',
    component: Dashboard,
    canActivate: [AuthGuard],
    data: { title: 'Dashboard' },
  },
  {
    path: 'my-reports',
    component: MyReports,
    canActivate: [AuthGuard],
    data: { title: 'My Reports' },
  },
  {
    path: 'my-reports/:id',
    component: ReportDetails,
    canActivate: [AuthGuard],
    data: { title: 'Report Details' },
  },
];
