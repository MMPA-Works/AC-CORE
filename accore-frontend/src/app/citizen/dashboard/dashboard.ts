import { Component, inject, OnInit, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HazardReportService } from '../../services/hazard-report';
import { AuthService } from '../../shared/auth'; 

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
  private cdr = inject(ChangeDetectorRef);
  private authService = inject(AuthService); 

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
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Failed to fetch reports', error);
        this.errorMessage = 'Could not load your reports. Please try again later.';
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  onLogout() {
    // Rely on the service to handle tokens and Google sessions
    this.authService.logout();
    sessionStorage.clear(); 
    this.router.navigate(['/']);
  }
}