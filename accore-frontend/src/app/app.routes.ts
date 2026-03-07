import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.routes').then(m => m.adminRoutes)
  },
  {
    path: '',
    loadChildren: () => import('./citizen/citizen.routes').then(m => m.citizenRoutes)
  }
]; 