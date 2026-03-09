import { Component, inject, OnInit, OnDestroy, PLATFORM_ID, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HazardReportService } from '../../services/hazard-report';
import * as L from 'leaflet';
import { SidebarComponent } from '../sidebar/sidebar';
import { LucideAngularModule } from 'lucide-angular';
import { HlmScrollAreaImports } from '@spartan-ng/helm/scroll-area';
import { HlmSkeletonImports } from '@spartan-ng/helm/skeleton';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    SidebarComponent,
    LucideAngularModule,
    HlmScrollAreaImports,
    HlmSkeletonImports,
  ],
  templateUrl: './admin-dashboard.html',
})
export class AdminDashboard implements OnInit, OnDestroy {
  private hazardReportService = inject(HazardReportService);
  private platformId = inject(PLATFORM_ID);

  reports = signal<any[]>([]);
  isLoading = signal<boolean>(true);
  errorMessage = signal<string>('');

  // New Signal to control the collapsible panel
  isPanelOpen = signal<boolean>(true);

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

  // Toggles the panel open and closed
  togglePanel() {
    this.isPanelOpen.update((state) => !state);
  }

  fetchReports() {
    this.isLoading.set(true);
    this.hazardReportService.getReports().subscribe({
      next: (data) => {
        this.reports.set(data);
        this.isLoading.set(false);
        setTimeout(() => this.initMap(), 0);
      },
      error: (error) => {
        console.error('Failed to fetch reports', error);
        this.errorMessage.set('Could not load reports.');
        this.isLoading.set(false);
      },
    });
  }

  private initMap(): void {
    if (this.map) {
      this.map.remove();
    }

    this.map = L.map('admin-map', { zoomControl: false }).setView([15.145, 120.5887], 13);
    L.control.zoom({ position: 'bottomleft' }).addTo(this.map);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(this.map);

    this.plotAllMarkers();

    setTimeout(() => {
      if (this.map) {
        this.map.invalidateSize();
      }
    }, 100);
  }

  private plotAllMarkers(): void {
    if (!this.map) return;

    const currentMap = this.map;
    const currentReports = this.reports();

    currentReports.forEach((report) => {
      if (report.location && report.location.coordinates) {
        const lng = report.location.coordinates[0];
        const lat = report.location.coordinates[1];

        const markerColor = this.getMarkerColor(report.status);
        const categoryInitial = report.category ? report.category.charAt(0) : '!';

        // Keep the sleek marker icon we built
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
          iconSize: [32, 40],
          iconAnchor: [16, 40],
          popupAnchor: [0, -42], // Slightly raised to clear the marker pin
        });

        const marker = L.marker([lat, lng], { icon: customIcon }).addTo(currentMap);

        // Define the color classes for the status dot
        let dotColor = 'bg-gray-500';
        let glowShadow = '';
        if (report.status === 'Reported') {
          dotColor = 'bg-red-500';
          glowShadow = 'shadow-[0_0_8px_rgba(239,68,68,0.8)]';
        } else if (report.status === 'Dispatched') {
          dotColor = 'bg-amber-500';
          glowShadow = 'shadow-[0_0_8px_rgba(245,158,11,0.8)]';
        } else if (report.status === 'Resolved') {
          dotColor = 'bg-green-500';
          glowShadow = 'shadow-[0_0_8px_rgba(34,197,94,0.8)]';
        }

        // The Premium Popup HTML
        const popupContent = `
          <div class="p-1 min-w-[260px] max-w-[300px] font-sans cursor-default">
            
            ${
              report.imageURL
                ? `
              <div class="relative w-full h-36 mb-4 rounded-[14px] overflow-hidden shadow-sm group">
                <img src="${report.imageURL}" alt="Hazard" loading="lazy" class="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110">
                <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                
                <div class="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-md shadow-sm">
                   <span class="w-1.5 h-1.5 rounded-full ${dotColor} ${glowShadow}"></span>
                   <span class="text-[9px] font-bold uppercase tracking-wider text-gray-800">${report.status}</span>
                </div>
              </div>
            `
                : `
              <div class="flex items-center gap-1.5 px-2.5 py-1 mb-3 inline-flex rounded-full bg-gray-100 shadow-sm">
                 <span class="w-1.5 h-1.5 rounded-full ${dotColor} ${glowShadow}"></span>
                 <span class="text-[9px] font-bold uppercase tracking-wider text-gray-700">${report.status}</span>
              </div>
            `
            }
            
            <div class="px-1">
              <h3 class="font-bold text-gray-900 text-[16px] leading-snug mb-1.5 tracking-tight">${report.title}</h3>
              <p class="text-[13px] text-gray-500 mb-4 leading-relaxed line-clamp-3">${report.description || 'No additional details provided for this incident.'}</p>
              
              <div class="flex items-center justify-between text-[11px] text-gray-400 border-t border-gray-100/80 pt-3">
                <span class="flex items-center font-medium text-gray-600 truncate max-w-[140px]">
                  <svg class="w-3.5 h-3.5 mr-1.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg> 
                  Brgy. ${report.barangay}
                </span>
                <span class="shrink-0 font-medium">${new Date(report.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>

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
        return 'bg-primary';
      case 'Dispatched':
        return 'bg-secondary';
      case 'Resolved':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  }

  focusOnReport(report: any): void {
    if (this.map && report.location && report.location.coordinates) {
      const lng = report.location.coordinates[0];
      const lat = report.location.coordinates[1];

      this.map.flyTo([lat, lng], 17, { duration: 1.5 });

      // Optional: Automatically close the panel on smaller screens when they click a report
      if (window.innerWidth < 1024) {
        this.isPanelOpen.set(false);
      }
    }
  }
}
