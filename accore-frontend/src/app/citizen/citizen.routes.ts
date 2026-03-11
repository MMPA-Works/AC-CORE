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

export const CITIZEN_ROUTES: Routes = [
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
