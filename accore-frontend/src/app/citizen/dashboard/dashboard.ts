import { Component, inject, OnInit, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HazardReportService } from '../../services/hazard-report';

@Component({
  selector: 'app-citizen-dashboard',
  standalone: true,
  imports: [RouterModule, CommonModule, HlmButtonImports],
  templateUrl: './dashboard.html',
})
export class Dashboard implements OnInit {
  private router = inject(Router);
  private hazardReportService = inject(HazardReportService);
  private platformId = inject(PLATFORM_ID);

  // We inject this to manually tell Angular to update the screen
  private cdr = inject(ChangeDetectorRef);

  myReports: any[] = [];
  isLoading = true;
  errorMessage = '';

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.fetchReports();
    }
  }

  fetchReports() {
    this.hazardReportService.getReports().subscribe({
      next: (data) => {
        this.myReports = data;
        this.isLoading = false;
        // Manually trigger a screen update
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Failed to fetch reports', error);
        this.errorMessage = 'Could not load your reports. Please try again later.';
        this.isLoading = false;
        // Manually trigger a screen update
        this.cdr.detectChanges();
      },
    });
  }

  onLogout() {
    localStorage.removeItem('token');
    localStorage.clear();
    sessionStorage.clear();

    this.router.navigate(['/']);
  }
}
