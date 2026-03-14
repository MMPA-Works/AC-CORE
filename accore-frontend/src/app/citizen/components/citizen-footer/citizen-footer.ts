import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { LucideAngularModule, LUCIDE_ICONS, LucideIconProvider, Phone, Shield } from 'lucide-angular';
import { AuthService } from '../../../shared/auth'; // Ensure this path is correct

@Component({
  selector: 'app-citizen-footer',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  templateUrl: './citizen-footer.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: LUCIDE_ICONS,
      useValue: new LucideIconProvider({ Phone, Shield })
    }
  ]
})
export class CitizenFooterComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  readonly currentYear = new Date().getFullYear();

  /**
   * Logic: Show footer everywhere EXCEPT when:
   * 1. Path is exactly '/report'
   * 2. AND user is NOT logged in (Guest)
   */
  get isVisible(): boolean {
    const isReportPage = this.router.url === '/report' || this.router.url === '/citizen/report';
    const isLoggedIn = !!this.authService.getCitizenToken();

    if (isReportPage && !isLoggedIn) {
      return false;
    }
    return true;
  }

  readonly platformLinks = [
    { label: 'Dashboard', route: '/citizen/dashboard' },
    { label: 'Report Hazard', route: '/citizen/report' },
    { label: 'My Reports', route: '/citizen/my-reports' },
    { label: 'Emergency Directory', route: '/citizen/directory' },
  ] as const;

  readonly legalLinks = [
    { label: 'Privacy Policy', route: '/citizen/privacy' },
    { label: 'Terms of Service', route: '/citizen/terms' },
    { label: 'Cookie Policy', route: '/citizen/cookies' },
  ] as const;
}