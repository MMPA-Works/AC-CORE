import { Component, inject, OnDestroy, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HazardReportService } from '../../services/hazard-report';
import * as L from 'leaflet';
import { LucideAngularModule } from 'lucide-angular';
import { HlmScrollAreaImports } from '@spartan-ng/helm/scroll-area';
import { HlmSkeletonImports } from '@spartan-ng/helm/skeleton';
import { EMPTY, Subject, timer } from 'rxjs';
import { catchError, switchMap, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-live-map',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    HlmScrollAreaImports,
    HlmSkeletonImports,
  ],
  templateUrl: './live-map.html',
  styleUrls: ['./live-map.css']
})
export class LiveMap implements OnInit, OnDestroy {
  private hazardReportService = inject(HazardReportService);
  private platformId = inject(PLATFORM_ID);
  private readonly destroy$ = new Subject<void>();
  private readonly refreshIntervalMs = 10000;
  private readonly activeStatuses = new Set(['Reported', 'Under Review', 'In Progress']);

  reports = signal<any[]>([]);

  isLoading = signal<boolean>(true);
  errorMessage = signal<string>('');
  isPanelOpen = signal<boolean>(true);

  private map: L.Map | undefined;
  private markerLayer: L.LayerGroup | undefined;

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.startAutoRefresh();
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();

    if (this.map) {
      this.map.remove();
      this.map = undefined;
    }
  }

  togglePanel() {
    this.isPanelOpen.update((state) => !state);
  }

  private startAutoRefresh(): void {
    this.isLoading.set(true);

    timer(0, this.refreshIntervalMs).pipe(
      takeUntil(this.destroy$),
      switchMap(() =>
        this.hazardReportService.getReports().pipe(
          catchError((error) => {
            console.error('Failed to fetch reports', error);
            this.errorMessage.set(this.reports().length ? 'Live updates paused. Retrying...' : 'Could not load reports.');
            this.isLoading.set(false);
            return EMPTY;
          })
        )
      )
    ).subscribe((data: any) => this.handleReportsResponse(data));
  }

  private handleReportsResponse(data: any): void {
    const actualData = Array.isArray(data) ? data : (data.reports || []);
    const activeReports = actualData.filter((report: any) => this.activeStatuses.has(report.status));

    this.reports.set(activeReports);
    this.errorMessage.set('');
    this.isLoading.set(false);

    if (!this.map) {
      setTimeout(() => this.initMap(), 0);
      return;
    }

    this.refreshMarkers();
  }

  private initMap(): void {
    if (this.map) {
      return;
    }

    this.map = L.map('admin-map', { zoomControl: false }).setView([15.145, 120.5887], 13);

    L.control.zoom({ position: 'bottomleft' }).addTo(this.map);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(this.map);

    this.markerLayer = L.layerGroup().addTo(this.map);
    this.refreshMarkers();

    setTimeout(() => {
      if (this.map) {
        this.map.invalidateSize();
      }
    }, 100);
  }

  private refreshMarkers(): void {
    if (!this.map || !this.markerLayer) return;

    this.markerLayer.clearLayers();

    this.reports().forEach((report) => {
      if (report.location && report.location.coordinates) {
        const lng = report.location.coordinates[0];
        const lat = report.location.coordinates[1];

        const markerColor = this.getMarkerColor(report.status);
        const categoryInitial = report.category ? report.category.charAt(0) : '!';

        const customIcon = L.divIcon({
          className: 'bg-transparent border-0',
          html: `
            <div class="relative z-50 flex flex-col items-center justify-center transition-transform hover:scale-110">
              <div class="flex items-center justify-center w-8 h-8 ${markerColor} rounded-full shadow-lg border-2 border-white">
                <span class="text-white text-xs font-bold">${categoryInitial}</span>
              </div>
              <div class="w-2 h-2 ${markerColor} rotate-45 -mt-1 border-r-2 border-b-2 border-white shadow-sm"></div>
            </div>
          `,
          iconSize: [32, 40],
          iconAnchor: [16, 40],
          popupAnchor: [0, -42],
        });

        const marker = L.marker([lat, lng], { icon: customIcon }).addTo(this.markerLayer!);

        marker.bindPopup(`
          <div class="p-1 min-w-[260px] max-w-[300px] font-sans">
            <h3 class="font-bold text-gray-900 text-[15px] mb-1">${report.title}</h3>
            <p class="text-[12px] text-gray-500 mb-3">${report.description || 'No details provided.'}</p>

            <div class="flex justify-between text-[11px] text-gray-400 border-t pt-2">
              <span>Brgy. ${report.barangay}</span>
              <span>${new Date(report.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
        `);
      }
    });
  }

  private getMarkerColor(status: string): string {
    switch (status) {
      case 'Reported': return 'bg-red-500';
      case 'Under Review': return 'bg-amber-500';
      case 'In Progress':
      case 'Dispatched': return 'bg-blue-500';
      case 'Resolved': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  }

  focusOnReport(report: any): void {
    if (this.map && report.location && report.location.coordinates) {
      const lng = report.location.coordinates[0];
      const lat = report.location.coordinates[1];

      this.map.flyTo([lat, lng], 17, { duration: 1.5 });

      if (window.innerWidth < 1024) {
        this.isPanelOpen.set(false);
      }
    }
  }
}
