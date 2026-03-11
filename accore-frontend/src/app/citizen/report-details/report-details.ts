import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmSpinnerImports } from '@spartan-ng/helm/spinner';
import { HazardReportService } from '../../services/hazard-report';
import { AuthService } from '../../shared/auth';
import { HazardReport } from '../../shared/models/hazard-report';
import { CitizenHeaderComponent } from '../components/citizen-header/citizen-header';
import { PizzaTrackerComponent } from '../components/pizza-tracker/pizza-tracker';

type CitizenIdentity = {
  _id?: string;
  firstName?: string;
  lastName?: string;
};

type HazardReportDetail = Omit<HazardReport, 'citizenId'> & {
  citizenId: string | CitizenIdentity;
};

@Component({
  selector: 'app-report-details',
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
  templateUrl: './report-details.html',
})
export class ReportDetails implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly hazardReportService = inject(HazardReportService);

  readonly report = signal<HazardReportDetail | null>(null);
  readonly isLoading = signal(true);
  readonly errorMessage = signal('');
  readonly hasBrokenImage = signal(false);

  readonly ownerName = computed(() => {
    const owner = this.report()?.citizenId;
    if (!owner || typeof owner === 'string') {
      return 'Citizen Reporter';
    }

    const fullName = `${owner.firstName ?? ''} ${owner.lastName ?? ''}`.trim();
    return fullName || 'Citizen Reporter';
  });

  readonly ownerInitials = computed(() => {
    const owner = this.report()?.citizenId;
    if (!owner || typeof owner === 'string') {
      return 'CR';
    }

    const initials = `${owner.firstName?.charAt(0) ?? ''}${owner.lastName?.charAt(0) ?? ''}`.toUpperCase();
    return initials || 'CR';
  });

  readonly timelineEntries = computed(() => {
    const currentReport = this.report();
    if (!currentReport) {
      return [];
    }

    const entries = [...(currentReport.statusHistory ?? [])]
      .sort((left, right) => new Date(left.updatedAt).getTime() - new Date(right.updatedAt).getTime())
      .map((entry) => ({
        ...entry,
        displayStatus: entry.status === 'Dispatched' ? 'In Progress' : entry.status,
      }));

    const hasInitialReportedEntry = entries.some((entry) => entry.status === 'Reported');
    if (!hasInitialReportedEntry) {
      entries.unshift({
        status: 'Reported',
        displayStatus: 'Reported',
        updatedBy: '',
        adminName: 'Citizen Reporter',
        updatedAt: currentReport.createdAt,
      });
    }

    return entries;
  });

  ngOnInit(): void {
    const reportId = this.route.snapshot.paramMap.get('id');

    if (!reportId) {
      this.errorMessage.set('Missing report reference.');
      this.isLoading.set(false);
      return;
    }

    this.fetchReport(reportId);
  }

  fetchReport(reportId: string): void {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.hasBrokenImage.set(false);

    this.hazardReportService.getReportById(reportId).subscribe({
      next: (response) => {
        const report = (response as any)?.report || (response as any)?.data || response;
        const normalizedReport = report as HazardReportDetail;
        const currentUserId = this.authService.getUserId();
        const ownerId = this.getReportOwnerId(normalizedReport);

        if (currentUserId && ownerId && currentUserId !== ownerId) {
          this.errorMessage.set('This report is not available from your citizen account.');
          this.report.set(null);
        } else {
          this.report.set(normalizedReport);
        }

        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to load report details', error);
        this.errorMessage.set('Could not load this report right now. Please try again.');
        this.isLoading.set(false);
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/citizen/my-reports']);
  }

  markImageAsBroken(): void {
    this.hasBrokenImage.set(true);
  }

  getStatusClasses(status: HazardReport['status']): string {
    switch (status) {
      case 'Resolved':
        return 'bg-green-500/10 text-green-700 ring-1 ring-green-500/20';
      case 'Dispatched':
      case 'In Progress':
        return 'bg-secondary/25 text-foreground ring-1 ring-secondary/30';
      case 'Under Review':
        return 'bg-primary/10 text-primary ring-1 ring-primary/20';
      case 'Reported':
      default:
        return 'bg-primary/10 text-primary ring-1 ring-primary/20';
    }
  }

  getSeverityClasses(severity: HazardReport['severity']): string {
    switch (severity) {
      case 'Critical':
        return 'bg-destructive text-white';
      case 'Medium':
        return 'bg-secondary text-secondary-foreground';
      case 'Low':
      default:
        return 'bg-muted text-foreground';
    }
  }

  getTrackerNote(status: HazardReport['status']): string {
    switch (status) {
      case 'Resolved':
        return 'The issue has been marked resolved by the city team.';
      case 'Dispatched':
      case 'In Progress':
        return 'Your report is currently being handled by the city team.';
      case 'Under Review':
        return 'City staff is validating the information attached to this report.';
      case 'Reported':
      default:
        return 'Your report has been logged and is waiting for formal review.';
    }
  }

  getDisplayStatus(status: HazardReport['status']): string {
    return status === 'Dispatched' ? 'In Progress' : status;
  }

  getProgressMeta(status: HazardReport['status'], updatedAt: string, createdAt: string): string {
    const submittedLabel = `Submitted ${new Date(createdAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })}`;

    switch (status) {
      case 'Resolved':
        return `${submittedLabel} • Marked resolved ${new Date(updatedAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })}`;
      case 'Dispatched':
      case 'In Progress':
        return `${submittedLabel} • City response is underway`;
      case 'Under Review':
        return `${submittedLabel} • Waiting for verification`;
      case 'Reported':
      default:
        return `${submittedLabel} • Awaiting staff review`;
    }
  }

  getSummaryNote(status: HazardReport['status']): string {
    switch (status) {
      case 'Resolved':
        return 'This report has been closed and marked as resolved.';
      case 'Dispatched':
      case 'In Progress':
        return 'City responders are actively working on this issue.';
      case 'Under Review':
        return 'This report is being validated before field action.';
      case 'Reported':
      default:
        return 'This report is currently waiting for the city team to review it.';
    }
  }

  getMapUrl(report: HazardReportDetail): string {
    const [longitude, latitude] = report.location?.coordinates ?? [];

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return 'https://maps.google.com';
    }

    return `https://www.google.com/maps?q=${latitude},${longitude}`;
  }

  getCoordinatesLabel(report: HazardReportDetail): string {
    const [longitude, latitude] = report.location?.coordinates ?? [];

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return 'Coordinates unavailable';
    }

    return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
  }

  private getReportOwnerId(report: HazardReportDetail): string | null {
    const owner = report.citizenId;

    if (!owner) {
      return null;
    }

    if (typeof owner === 'string') {
      return owner;
    }

    return owner._id || null;
  }
}
