import { Component, inject, OnInit, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HazardReportService } from '../../services/hazard-report';
import { HazardReport } from '../../shared/models/hazard-report';
import { CitizenHeaderComponent } from '../components/citizen-header/citizen-header';

@Component({
  selector: 'app-citizen-dashboard',
  standalone: true,
  imports: [RouterModule, CommonModule, HlmButtonImports, CitizenHeaderComponent],
  templateUrl: './dashboard.html',
})
export class Dashboard implements OnInit {
  private hazardReportService = inject(HazardReportService);
  private platformId = inject(PLATFORM_ID);
  private cdr = inject(ChangeDetectorRef);

  myReports: HazardReport[] = [];
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
        this.myReports = data.slice(0, 3);
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

}
