import {
  Component,
  inject,
  OnInit,
  OnDestroy,
  PLATFORM_ID,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { HazardReportService } from '../../services/hazard-report';
import * as L from 'leaflet';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-dashboard.html',
})
export class AdminDashboard implements OnInit, OnDestroy {
  private router = inject(Router);
  private hazardReportService = inject(HazardReportService);
  private platformId = inject(PLATFORM_ID);
  private cdr = inject(ChangeDetectorRef);

  reports: any[] = [];
  isLoading = true;
  errorMessage = '';

  private map: L.Map | undefined;
  private markers: L.Marker[] = [];

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.fetchReports();
    }
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
    }
  }

  fetchReports() {
    this.hazardReportService.getReports().subscribe({
      next: (data) => {
        this.reports = data;
        this.isLoading = false;
        this.cdr.detectChanges();
        this.initMap();
      },
      error: (error) => {
        console.error('Failed to fetch reports', error);
        this.errorMessage = 'Could not load reports.';
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  private initMap(): void {
    this.map = L.map('admin-map').setView([15.145, 120.5887], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(this.map);

    this.plotAllMarkers();
  }

  private plotAllMarkers(): void {
    if (!this.map) return;

    // FIX: Lock the map instance into a constant so TypeScript knows it is not undefined inside the loop
    const currentMap = this.map;

    this.reports.forEach((report) => {
      if (report.location && report.location.coordinates) {
        const lng = report.location.coordinates[0];
        const lat = report.location.coordinates[1];

        const markerColor = this.getMarkerColor(report.status);

        const customIcon = L.divIcon({
          className: 'bg-transparent border-0',
          html: `
            <div class="relative flex flex-col items-center justify-center">
              <div class="flex items-center justify-center w-8 h-8 ${markerColor} rounded-full shadow-md border-2 border-white">
                <span class="text-white text-xs font-bold">${report.category.charAt(0)}</span>
              </div>
              <div class="w-2 h-2 ${markerColor} rotate-45 -mt-1 border-r-2 border-b-2 border-white"></div>
            </div>
          `,
          iconSize: [32, 40],
          iconAnchor: [16, 40],
          popupAnchor: [0, -40],
        });

        // FIX: Use currentMap instead of this.map
        const marker = L.marker([lat, lng], { icon: customIcon }).addTo(currentMap);

        const popupContent = `
          <div class="p-2 min-w-[200px]">
            <img src="${report.imageURL}" alt="Hazard" class="w-full h-32 object-cover rounded mb-2">
            <h3 class="font-bold text-gray-900 mb-1">${report.title}</h3>
            <p class="text-sm text-gray-600 mb-2">${report.description}</p>
            <span class="text-xs font-semibold px-2 py-1 rounded bg-gray-100">${report.status}</span>
          </div>
        `;

        marker.bindPopup(popupContent);
        this.markers.push(marker);
      }
    });
  }

  private getMarkerColor(status: string): string {
    switch (status) {
      case 'Reported':
        return 'bg-red-600';
      case 'Dispatched':
        return 'bg-blue-600';
      case 'Resolved':
        return 'bg-green-600';
      default:
        return 'bg-gray-600';
    }
  }

  focusOnReport(report: any): void {
    if (this.map && report.location && report.location.coordinates) {
      const lng = report.location.coordinates[0];
      const lat = report.location.coordinates[1];

      this.map.flyTo([lat, lng], 17, { duration: 1.5 });
    }
  }

  onLogout() {
    localStorage.removeItem('token');

    localStorage.clear();
    sessionStorage.clear();

    this.router.navigate(['/admin/login']);
  }
}
