import { Routes } from '@angular/router';
import { Login } from './login/login';
import { AdminLayout } from './admin-layout/admin-layout';
import { AnalyticsDashboard } from './analytics-dashboard/analytics-dashboard';
import { LiveMap } from './live-map/live-map';
import { HazardList } from './hazard-list/hazard-list';
import { HazardDetails } from './hazard-details/hazard-details';
import { AuthGuard } from '../shared/auth.guard';
import { ReportsGeneration } from './reports-generation/reports-generation';

export const ADMIN_ROUTES: Routes = [
  { path: 'login', component: Login, data: { title: 'Admin Login' } },
  { 
    path: '', 
    component: AdminLayout,
    canActivate: [AuthGuard],
    children: [
      { path: 'dashboard', component: AnalyticsDashboard, data: { title: 'Dashboard' } },
      { path: 'map', component: LiveMap, data: { title: 'Live Map' } },
      { path: 'hazards', component: HazardList, data: { title: 'Hazard Reports' } },
      { path: 'hazards/:id', component: HazardDetails, data: { title: 'Hazard Details' } },
      {
        path: 'reports-generation',
        component: ReportsGeneration,
        data: { title: 'Historical Reports' },
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  }
];
