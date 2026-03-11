import { Component, OnInit, signal, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import * as L from 'leaflet';

import { HazardReportService } from '../../services/hazard-report';
import { ExportService } from '../../services/export';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmScrollAreaImports } from '@spartan-ng/helm/scroll-area';
import { HlmSeparatorImports } from '@spartan-ng/helm/separator';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { HlmDialogImports } from '@spartan-ng/helm/dialog';
import { BrnSelectImports } from '@spartan-ng/brain/select';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { toast } from 'ngx-sonner';

@Component({
  selector: 'app-hazard-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    HlmCardImports,
    HlmButtonImports,
    HlmScrollAreaImports,
    HlmSeparatorImports,
    HlmBadgeImports,
    HlmDialogImports,
    BrnSelectImports,
    HlmSelectImports
  ],
  providers: [HazardReportService],
  templateUrl: './hazard-list.html'
})
export class HazardList implements OnInit {
  reports = signal<any[]>([]);
  selectedReport = signal<any>(null);
  pendingStatus = signal<string>('');
  private mapInstance: L.Map | undefined;

  filterBarangay = signal<string>('All');
  filterCategory = signal<string>('All');
  filterSeverity = signal<string>('All');
  filterStatus = signal<string>('All');

  availableBarangays = computed(() => {
    const all = this.reports().map(r => r.barangay).filter(Boolean);
    return ['All', ...Array.from(new Set(all)).sort()];
  });

  availableCategories = computed(() => {
    const all = this.reports().map(r => r.category).filter(Boolean);
    return ['All', ...Array.from(new Set(all)).sort()];
  });

  filteredReports = computed(() => {
    const brgy = this.filterBarangay();
    const cat = this.filterCategory();
    const sev = this.filterSeverity();
    const stat = this.filterStatus();

    return this.reports().filter(report => {
      const matchBrgy = brgy === 'All' || report.barangay === brgy;
      const matchCat = cat === 'All' || report.category === cat;
      const matchSev = sev === 'All' || report.severity === sev;
      const matchStat = stat === 'All' || report.status === stat;
      return matchBrgy && matchCat && matchSev && matchStat;
    });
  });

  constructor(
    private hazardService: HazardReportService,
    private exportService: ExportService
  ) {
    effect(() => {
      const report = this.selectedReport();
      if (report?.location?.coordinates) {
        setTimeout(() => this.initializeMap(report), 0);
      }
    });
  }

  ngOnInit(): void {
    this.fetchAllReports();
  }

  fetchAllReports(): void {
    this.hazardService.getReports().subscribe({
      next: (response: any) => {
        const data = Array.isArray(response) ? response : (response.reports || []);
        this.reports.set(data);
      },
      error: (err) => {
        console.error('Error fetching reports:', err);
        toast.error('Failed to load reports');
      }
    });
  }

  viewDetails(id: string): void {
    // Optimistic UI Update for instant rendering
    const localReport = this.reports().find(r => r._id === id);
    if (localReport) {
      this.selectedReport.set(localReport);
      this.pendingStatus.set(localReport.status);
    }

    // Fetch fresh data in the background
    this.hazardService.getReportById(id).subscribe({
      next: (response: any) => {
        const data = response.report || response.data || response;
        this.selectedReport.set(data);
        this.pendingStatus.set(data.status);
      },
      error: (err) => {
        console.error('Error fetching details:', err);
        toast.error('Failed to load details');
      }
    });
  }

  saveStatus(): void {
    const currentReport = this.selectedReport();
    const newStatus = this.pendingStatus();

    if (currentReport && newStatus !== currentReport.status) {
      this.hazardService.updateReportStatus(currentReport._id, newStatus).subscribe({
        next: (updatedReport) => {
          this.selectedReport.set(updatedReport);
          this.fetchAllReports();
          toast.success('Status updated successfully');
        },
        error: (err) => {
          console.error('Error updating status:', err);
          toast.error('Failed to update status');
        }
      });
    }
  }

  exportToCSV(): void {
    this.exportService.exportToCSV(this.filteredReports(), 'hazard_reports.csv');
  }

  private getMarkerColor(status: string): string {
    switch (status) {
      case 'Reported': return 'bg-red-500';
      case 'Under Review': return 'bg-amber-500';
      case 'In Progress': return 'bg-blue-500';
      case 'Resolved': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  }

  private initializeMap(report: any): void {
    if (this.mapInstance) this.mapInstance.remove();

    const lat = report.location.coordinates[0];
    const lng = report.location.coordinates[1];

    this.mapInstance = L.map('minimap', { zoomControl: false }).setView([lat, lng], 16);

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