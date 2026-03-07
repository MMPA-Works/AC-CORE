import { Routes } from '@angular/router';

// Lazy loading splits the code into smaller chunks to improve mobile load times.
export const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./citizen/citizen.routes').then(m => m.CITIZEN_ROUTES)
  },
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.routes').then(m => m.ADMIN_ROUTES)
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full'
  }
];