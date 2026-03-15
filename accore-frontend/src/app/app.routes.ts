import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.routes').then(m => m.ADMIN_ROUTES),
    data: { title: 'Admin' },
  },
  {
    path: 'citizen',
    loadChildren: () => import('./citizen/citizen.routes').then(m => m.CITIZEN_ROUTES),
    data: { title: 'Citizen' },
  },
  {
    path: '',
    loadChildren: () => import('./citizen/citizen.routes').then(m => m.CITIZEN_ROUTES),
    data: { title: 'Home' },
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full'
  }
];
