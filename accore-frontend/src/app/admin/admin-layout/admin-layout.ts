import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar';
import { LucideAngularModule } from 'lucide-angular';
import { AdminFooter } from '../admin-footer/admin-footer';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent, LucideAngularModule, AdminFooter],
  templateUrl: './admin-layout.html'
})
export class AdminLayout {
  private router = inject(Router);

  get showFooter(): boolean {
    return !this.router.url.includes('/map');
  }
}