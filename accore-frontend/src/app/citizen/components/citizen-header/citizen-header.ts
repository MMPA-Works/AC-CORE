import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { AuthService } from '../../../shared/auth';

@Component({
  selector: 'app-citizen-header',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule, HlmButtonImports],
  templateUrl: './citizen-header.html',
})
export class CitizenHeaderComponent {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  readonly navItems = [
    {
      label: 'Dashboard',
      route: '/citizen/dashboard',
      aliases: ['/dashboard', '/citizen/dashboard'],
      icon: 'layout-dashboard',
    },
    {
      label: 'Report Hazard',
      route: '/citizen/report',
      aliases: ['/report', '/citizen/report'],
      icon: 'alert-triangle',
    },
    {
      label: 'My Reports',
      route: '/citizen/my-reports',
      aliases: ['/my-reports', '/citizen/my-reports'],
      icon: 'clock',
    },
  ] as const;

  isActive(aliases: readonly string[]): boolean {
    return aliases.some((alias) => this.router.url === alias || this.router.url.startsWith(`${alias}/`));
  }

  onLogout(): void {
    this.authService.logout();
    sessionStorage.clear();
    this.router.navigate(['/']);
  }
}
