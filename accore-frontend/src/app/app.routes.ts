import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.routes').then(m => m.ADMIN_ROUTES)
  },
  {
    path: 'citizen',
    loadChildren: () => import('./citizen/citizen.routes').then(m => m.CITIZEN_ROUTES)
  },
  {
    path: '',
    loadChildren: () => import('./citizen/citizen.routes').then(m => m.CITIZEN_ROUTES)
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full'
  }
];
