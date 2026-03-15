import { ChangeDetectionStrategy, Component, OnInit, computed, effect, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import * as L from 'leaflet';

import { HazardReportService } from '../../services/hazard-report';
import { HazardReportStatus } from '../../shared/models/hazard-report';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmDialogImports } from '@spartan-ng/helm/dialog';
import { BrnSelectImports } from '@spartan-ng/brain/select';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { toast } from 'ngx-sonner';

@Component({
  selector: 'app-hazard-details',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HlmButtonImports,
    HlmDialogImports,
    BrnSelectImports,
    HlmSelectImports
  ],
  providers: [HazardReportService],
  templateUrl: './hazard-details.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HazardDetails implements OnInit {
  report = signal<any>(null);
  pendingStatus = signal<HazardReportStatus | ''>('');
  isArchiving = signal<boolean>(false);
  private mapInstance: L.Map | undefined;

  readonly STATUS_PIPELINE: HazardReportStatus[] = ['Reported', 'Under Review', 'In Progress', 'Resolved'];

  trackerSteps = computed(() => {
    const rep = this.report();
    if (!rep) {
      return [];
    }

    const currentIndex = this.STATUS_PIPELINE.indexOf(this.normalizeStatus(rep.status));

    return this.STATUS_PIPELINE.map((status) => {
      let history = null;

      if (rep.statusHistory?.length) {
        history = [...rep.statusHistory]
          .reverse()
          .find((entry: any) => this.normalizeStatus(entry.status) === status);
      }

      if (status === 'Reported' && !history) {
        history = {
          updatedAt: rep.createdAt,
          adminName: this.getReporterName(rep)
        };
      }

      return {
        status,
        isActive: this.STATUS_PIPELINE.indexOf(status) <= currentIndex,
        history
      };
    });
  });

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private hazardService: HazardReportService
  ) {
    effect(() => {
      const currentReport = this.report();
      if (currentReport?.location?.coordinates) {
        setTimeout(() => this.initializeMap(currentReport), 0);
      }
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.fetchDetails(id);
    }
  }

  goBack(): void {
    this.location.back();
  }

  fetchDetails(id: string): void {
    this.hazardService.getReportById(id).subscribe({
      next: (response: any) => {
        const data = response.report || response.data || response;
        this.report.set(data);
        this.pendingStatus.set(this.normalizeStatus(data.status));
      },
      error: (err) => {
        console.error('Error fetching details:', err);
        toast.error('Failed to load details');
      }
    });
  }

  isGuestReport(report: any): boolean {
    return !report?.citizenId;
  }

  getDisplayStatus(status: HazardReportStatus): string {
    return this.normalizeStatus(status);
  }

  getStatusBadgeClasses(status: HazardReportStatus): string {
    switch (this.normalizeStatus(status)) {
      case 'Resolved':
        return 'border-emerald-200 bg-emerald-50 text-emerald-700';
      case 'In Progress':
        return 'border-blue-200 bg-blue-50 text-blue-700';
      case 'Under Review':
        return 'border-amber-200 bg-amber-50 text-amber-700';
      case 'Reported':
      default:
        return 'border-red-200 bg-red-50 text-red-700';
    }
  }

  getReporterName(report: any): string {
    if (report?.citizenId?.firstName) {
      return `${report.citizenId.firstName} ${report.citizenId.lastName}`;
    }

    return this.isGuestReport(report) ? 'Guest Reporter' : 'Citizen Reporter';
  }

  getReporterContext(report: any): string {
    return this.isGuestReport(report)
      ? 'Submitted without an account'
      : 'Reported via Citizen Portal';
  }

  getSourceLabel(report: any): string {
    return this.isGuestReport(report) ? 'Guest Report' : 'Citizen Report';
  }

  getReporterInitial(report: any): string {
    if (report?.citizenId?.firstName) {
      return report.citizenId.firstName.charAt(0).toUpperCase();
    }

    return this.isGuestReport(report) ? 'G' : 'C';
  }

  getShortId(report: any): string {
    return report?._id ? String(report._id).slice(-8).toUpperCase() : 'UNKNOWN';
  }

  getCoordinatesLabel(report: any): string {
    const [longitude, latitude] = report?.location?.coordinates ?? [];

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return 'Coordinates unavailable';
    }

    return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
  }

  hasCoordinates(report: any): boolean {
    const [longitude, latitude] = report?.location?.coordinates ?? [];
    return typeof latitude === 'number' && typeof longitude === 'number';
  }

  getMapUrl(report: any): string {
    const [longitude, latitude] = report?.location?.coordinates ?? [];

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return 'https://maps.google.com';
    }

    return `https://www.google.com/maps?q=${latitude},${longitude}`;
  }

  copyCoordinates(report: any): void {
    const [longitude, latitude] = report?.location?.coordinates ?? [];

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      toast.error('Coordinates unavailable');
      return;
    }

    navigator.clipboard.writeText(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`)
      .then(() => toast.success('Coordinates copied'))
      .catch(() => toast.error('Failed to copy coordinates'));
  }

  getArchiveButtonLabel(report: any): string {
    if (report?.isArchived) {
      return 'Restore Report';
    }

    return this.isGuestReport(report) ? 'Flag as Spam' : 'Archive Report';
  }

  saveStatus(): void {
    const currentReport = this.report();
    const newStatus = this.pendingStatus();

    if (currentReport && newStatus && newStatus !== this.normalizeStatus(currentReport.status)) {
      this.hazardService.updateReportStatus(currentReport._id, newStatus).subscribe({
        next: (updatedReport) => {
          this.report.set({
            ...updatedReport,
            citizenId: currentReport.citizenId
          });
          this.pendingStatus.set(this.normalizeStatus(updatedReport.status));
          toast.success('Status updated successfully');
        },
        error: (err) => {
          console.error('Error updating status:', err);
          toast.error('Failed to update status');
        }
      });
    }
  }

  toggleArchive(): void {
    const currentReport = this.report();
    if (!currentReport || this.isArchiving()) {
      return;
    }

    this.isArchiving.set(true);
    this.hazardService.archiveReport(currentReport._id).subscribe({
      next: (updatedReport) => {
        this.report.set({
          ...updatedReport,
          citizenId: currentReport.citizenId
        });

        this.isArchiving.set(false);

        if (updatedReport.isArchived) {
          toast.success(
            this.isGuestReport(currentReport)
              ? 'Guest report flagged as spam'
              : 'Report archived successfully'
          );
          this.router.navigate(['/admin/hazards']);
          return;
        }

        toast.success('Report restored successfully');
      },
      error: (err) => {
        console.error('Error archiving report:', err);
        this.isArchiving.set(false);
        toast.error('Failed to archive report');
      }
    });
  }

  private getMarkerColor(severity: string | undefined): string {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return '#dc2626';
      case 'medium':
      case 'high':
        return '#f97316';
      case 'low':
        return '#eab308';
      default:
        return '#737373';
    }
  }

  private initializeMap(report: any): void {
    if (this.mapInstance) {
      this.mapInstance.remove();
    }

    const [lng, lat] = report.location.coordinates;

    this.mapInstance = L.map('details-minimap', { zoomControl: false }).setView([lat, lng], 16);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.mapInstance);

    const markerColor = this.getMarkerColor(report.severity);

    const customIcon = L.divIcon({
      className: 'bg-transparent border-0',
      html: `
        <div style="position: relative; display: flex; justify-content: center; align-items: center; width: 32px; height: 32px; transition: transform 0.2s ease-in-out;" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
          <div style="width: 24px; height: 24px; background-color: ${markerColor}; border: 2px solid white; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); box-shadow: 0 3px 6px rgba(0,0,0,0.3); display: flex; justify-content: center; align-items: center; z-index: 10;">
            <div style="width: 8px; height: 8px; background: white; border-radius: 50%; transform: rotate(45deg);"></div>
          </div>
        </div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
    });

    L.marker([lat, lng], { icon: customIcon }).addTo(this.mapInstance);
    setTimeout(() => this.mapInstance?.invalidateSize(), 100);
  }

  private normalizeStatus(status: HazardReportStatus): HazardReportStatus {
    return status === 'Dispatched' ? 'In Progress' : status;
  }
}