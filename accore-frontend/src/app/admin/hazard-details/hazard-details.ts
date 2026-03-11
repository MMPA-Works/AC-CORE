import { Component, OnInit, signal, effect, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import * as L from 'leaflet';

import { HazardReportService } from '../../services/hazard-report';
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
  pendingStatus = signal<string>('');
  private mapInstance: L.Map | undefined;

  readonly STATUS_PIPELINE = ['Reported', 'Under Review', 'In Progress', 'Resolved'];

  trackerSteps = computed(() => {
    const rep = this.report();
    if (!rep) return [];

    const currentIndex = this.STATUS_PIPELINE.indexOf(rep.status);

    return this.STATUS_PIPELINE.map((status, index) => {
      let history = null;
      
      if (rep.statusHistory && rep.statusHistory.length > 0) {
        history = [...rep.statusHistory].reverse().find((h: any) => h.status === status);
      }

      if (index === 0 && !history) {
        history = {
          updatedAt: rep.createdAt,
          adminName: rep.citizenId?.firstName ? (rep.citizenId.firstName + ' ' + rep.citizenId.lastName) : 'Citizen Reporter'
        };
      }

      return {
        status,
        isActive: index <= currentIndex,
        isNextActive: (index + 1) <= currentIndex,
        history
      };
    });
  });

  constructor(
    private route: ActivatedRoute,
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
        this.pendingStatus.set(data.status);
      },
      error: (err) => {
        console.error('Error fetching details:', err);
        toast.error('Failed to load details');
      }
    });
  }

// Inside src/app/admin/hazard-details/hazard-details.ts

  saveStatus(): void {
    const currentReport = this.report();
    const newStatus = this.pendingStatus();

    if (currentReport && newStatus !== currentReport.status) {
      this.hazardService.updateReportStatus(currentReport._id, newStatus).subscribe({
        next: (updatedReport) => {
          // BUG FIX: The backend returns an unpopulated citizenId string after saving.
          // We merge the new status/history with our existing populated citizenId object.
          this.report.set({
            ...updatedReport,
            citizenId: currentReport.citizenId 
          });
          toast.success('Status updated successfully');
        },
        error: (err) => {
          console.error('Error updating status:', err);
          toast.error('Failed to update status');
        }
      });
    }
  }

  private getMarkerColor(status: string): string {
    switch (status) {
      case 'Reported': return 'bg-primary';
      case 'Under Review': return 'bg-secondary';
      case 'In Progress': return 'bg-blue-500';
      case 'Resolved': return 'bg-green-600';
      default: return 'bg-gray-500';
    }
  }

  private initializeMap(report: any): void {
    if (this.mapInstance) this.mapInstance.remove();

    const lng = report.location.coordinates[0];
    const lat = report.location.coordinates[1];

    this.mapInstance = L.map('details-minimap', { zoomControl: false }).setView([lat, lng], 16);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.mapInstance);

    const markerColor = this.getMarkerColor(report.status);
    const categoryInitial = report.category ? report.category.charAt(0) : '!';

    const customIcon = L.divIcon({ 
      className: 'bg-transparent border-0',
      html: `
        <div class="relative flex flex-col items-center justify-center transition-transform hover:scale-110">
          <div class="flex items-center justify-center w-8 h-8 ${markerColor} rounded-full shadow-lg border-2 border-white">
            <span class="text-white text-xs font-bold">${categoryInitial}</span>
          </div>
          <div class="w-2 h-2 ${markerColor} rotate-45 -mt-1 border-r-2 border-b-2 border-white shadow-sm"></div>
        </div>
      `,
      iconSize:[32, 40],
      iconAnchor:[16, 40],
    });

    L.marker([lat, lng], { icon: customIcon }).addTo(this.mapInstance);
  }
}