import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmSpinnerImports } from '@spartan-ng/helm/spinner';
import { HazardReportService } from '../../services/hazard-report';
import { HazardReport } from '../../shared/models/hazard-report';
import { CitizenHeaderComponent } from '../components/citizen-header/citizen-header';
import { PizzaTrackerComponent } from '../components/pizza-tracker/pizza-tracker';

@Component({
  selector: 'app-my-reports',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    LucideAngularModule,
    HlmButtonImports,
    HlmCardImports,
    HlmSpinnerImports,
    CitizenHeaderComponent,
    PizzaTrackerComponent,
  ],
  templateUrl: './my-reports.html',
  styleUrl: './my-reports.css',
})
export class MyReports implements OnInit {
  private readonly hazardReportService = inject(HazardReportService);

  readonly reports = signal<HazardReport[]>([]);
  readonly isLoading = signal(true);
  readonly errorMessage = signal('');
  readonly brokenImageIds = signal<Record<string, boolean>>({});
  readonly summaryCards = computed(() => {
    const reports = this.reports();
    const total = reports.length;
    const resolved = reports.filter((report) => report.status === 'Resolved').length;
    const active = total - resolved;
    const critical = reports.filter((report) => report.severity === 'Critical').length;

    return [
      {
        label: 'Total Reports',
        description: 'Reports submitted',
        value: total,
        tone: 'text-foreground',
        accent: 'bg-primary/10 text-primary',
      },
      {
        label: 'Active',
        description: 'Still awaiting closure',
        value: active,
        tone: 'text-foreground',
        accent: 'bg-secondary/20 text-foreground',
      },
      {
        label: 'Resolved',
        description: 'Closed reports',
        value: resolved,
        tone: 'text-green-700',
        accent: 'bg-green-500/10 text-green-700',
      },
      {
        label: 'Critical',
        description: 'High-severity',
        value: critical,
        tone: 'text-foreground',
        accent: 'bg-destructive/10 text-destructive',
      },
    ];
  });

  ngOnInit(): void {
    this.fetchReports();
  }

  fetchReports(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.hazardReportService.getReports().subscribe({
      next: (reports) => {
        this.reports.set(reports);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to fetch citizen reports', error);
        this.errorMessage.set('Could not load your reports right now. Please try again.');
        this.isLoading.set(false);
      },
    });
  }

  markImageAsBroken(reportId: string): void {
    this.brokenImageIds.update((current) => ({ ...current, [reportId]: true }));
  }

  hasBrokenImage(reportId: string): boolean {
    return !!this.brokenImageIds()[reportId];
  }

  getStatusClasses(status: HazardReport['status']): string {
    switch (status) {
      case 'Resolved':
        return 'bg-white/95 text-green-700 ring-1 ring-green-500/25';
      case 'Dispatched':
      case 'In Progress':
        return 'bg-white/95 text-amber-700 ring-1 ring-amber-500/25';
      case 'Under Review':
        return 'bg-white/95 text-primary ring-1 ring-primary/20';
      case 'Reported':
      default:
        return 'bg-white/95 text-primary ring-1 ring-primary/20';
    }
  }

  getLatestAdminName(report: HazardReport): string | null {
    if (!report.statusHistory?.length) {
      return null;
    }

    return report.statusHistory[report.statusHistory.length - 1]?.adminName || null;
  }

  getSeverityClasses(severity: HazardReport['severity']): string {
    switch (severity) {
      case 'Critical':
        return 'bg-destructive text-white';
      case 'Medium':
        return 'bg-secondary text-secondary-foreground';
      case 'Low':
      default:
        return 'bg-background/90 text-foreground';
    }
  }

  getTrackerNote(status: HazardReport['status']): string {
    switch (status) {
      case 'Resolved':
        return 'The issue has been marked resolved by the city team.';
      case 'Dispatched':
      case 'In Progress':
        return 'Your report has been picked up and work is underway.';
      case 'Under Review':
        return 'City staff is currently reviewing the details you submitted.';
      case 'Reported':
      default:
        return 'Your report is queued and waiting for staff review.';
    }
  }

  getMapUrl(report: HazardReport): string {
    const [longitude, latitude] = report.location?.coordinates ?? [];

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return 'https://maps.google.com';
    }

    return `https://www.google.com/maps?q=${latitude},${longitude}`;
  }
}
