import { CommonModule } from '@angular/common';
import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../../../shared/auth';

@Component({
  selector: 'app-citizen-header',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  templateUrl: './citizen-header.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'sticky top-0 z-50 block w-full'
  }
})
export class CitizenHeaderComponent {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  isMobileMenuOpen = signal<boolean>(false);

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
    {
      label: 'Directory',
      route: '/citizen/directory',
      aliases: ['/directory', '/citizen/directory'],
      icon: 'users',
    },
  ] as const;

  isActive(aliases: readonly string[]): boolean {
    return aliases.some((alias) => this.router.url === alias || this.router.url.startsWith(`${alias}/`));
  }

  toggleMenu(): void {
    this.isMobileMenuOpen.update((isOpen) => !isOpen);
    this.handleBodyScroll();
  }

  closeMenu(): void {
    this.isMobileMenuOpen.set(false);
    this.handleBodyScroll();
  }

  private handleBodyScroll(): void {
    if (this.isMobileMenuOpen()) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }

  onLogout(): void {
    this.authService.logout();
    sessionStorage.clear();
    this.router.navigate(['/']);
  }
}