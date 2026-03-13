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
  },
  {
    path: 'login',
    component: Login,
  },
  {
    path: 'signup',
    component: Signup,
  },
  {
    path: 'report',
    component: Report,
  },
  { 
    path: 'directory', 
    component: Directory 
  },

  // Legal Pages (Wrapped in LegalLayout for Header/Footer)
  {
    path: '',
    component: LegalLayout,
    children: [
      { 
        path: 'privacy', 
        loadComponent: () => import('./legal/privacy').then(m => m.PrivacyComponent) 
      },
      { 
        path: 'terms', 
        loadComponent: () => import('./legal/terms').then(m => m.TermsComponent) 
      },
      { 
        path: 'cookies', 
        loadComponent: () => import('./legal/cookies').then(m => m.CookiesComponent) 
      }
    ]
  },

  // Protected Routes (Require Login)
  {
    path: 'dashboard',
    component: Dashboard,
    canActivate: [AuthGuard],
  },
  {
    path: 'my-reports',
    component: MyReports,
    canActivate: [AuthGuard],
  },
  {
    path: 'my-reports/:id',
    component: ReportDetails,
    canActivate: [AuthGuard],
  },
];