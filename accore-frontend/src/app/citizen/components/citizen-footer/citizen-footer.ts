import { Component, ChangeDetectionStrategy, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { LucideAngularModule, LUCIDE_ICONS, LucideIconProvider, Phone, Shield } from 'lucide-angular';
import { AuthService } from '../../../shared/auth';
import { filter, Subject, takeUntil } from 'rxjs';

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
export class CitizenFooterComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private router = inject(Router);
  private destroy$ = new Subject<void>();

  readonly currentYear = new Date().getFullYear();
  isVisible = true;

  readonly platformLinks = [
    { label: 'Dashboard', route: '/citizen/dashboard' },
    { label: 'Report Hazard', route: '/citizen/report' },
    { label: 'My Reports', route: '/citizen/my-reports' },
    { label: 'Emergency Directory', route: '/citizen/directory' },
  ] as const;

  readonly legalLinks = [
    { label: 'Privacy Policy', route: '/citizen/privacy' },
    { label: 'Terms of Service', route: '/citizen/terms' },
    { label: 'Tracking & Local Storage', route: '/citizen/tracking' },
  ] as const;

  ngOnInit(): void {
    this.evaluateVisibility(this.router.url);

    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe((event: NavigationEnd) => {
      this.evaluateVisibility(event.urlAfterRedirects);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private evaluateVisibility(url: string): void {
    const isReportPage = url.includes('/report');
    const isLoggedIn = !!this.authService.getCitizenToken();
    
    this.isVisible = !(isReportPage && !isLoggedIn);
  }

  trackByRoute(index: number, item: any): string {
    return item.route;
  }
}