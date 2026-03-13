import {
  Component,
  inject,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  signal,
  computed,
  ViewEncapsulation,
  NgZone,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HazardReportService } from '../../services/hazard-report';
import * as L from 'leaflet';
import 'leaflet.markercluster';
import { LucideAngularModule } from 'lucide-angular';
import { HlmSkeletonImports } from '@spartan-ng/helm/skeleton';
import { EMPTY, Subject, timer } from 'rxjs';
import { catchError, switchMap, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-live-map',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, HlmSkeletonImports],
  templateUrl: './live-map.html',
  styleUrls: ['./live-map.css'],
  encapsulation: ViewEncapsulation.None,
})
export class LiveMap implements OnInit, OnDestroy {
  private hazardReportService = inject(HazardReportService);
  private platformId = inject(PLATFORM_ID);
  private ngZone = inject(NgZone);
  private readonly destroy$ = new Subject<void>();
  private readonly refreshIntervalMs = 10000;
  private readonly activeStatuses = new Set(['Reported', 'Under Review', 'In Progress']);

  reports = signal<any[]>([]);
  reportedOnly = computed(() => this.reports().filter((r) => r.status === 'Reported'));

  isLoading = signal<boolean>(true);
  errorMessage = signal<string>('');
  isPanelOpen = signal<boolean>(true);

  private map: L.Map | undefined;
  private markerClusterGroup: L.MarkerClusterGroup | undefined;

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.startAutoRefresh();
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();

    if (this.markerClusterGroup) {
      this.markerClusterGroup.clearLayers();
    }
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

    timer(0, this.refreshIntervalMs)
      .pipe(
        takeUntil(this.destroy$),
        switchMap(() =>
          this.hazardReportService.getReports().pipe(
            catchError((error) => {
              console.error('Failed to fetch reports', error);
              this.errorMessage.set(
                this.reports().length
                  ? 'Live updates paused. Retrying...'
                  : 'Could not load reports.',
              );
              this.isLoading.set(false);
              return EMPTY;
            }),
          ),
        ),
      )
      .subscribe((data: any) => this.handleReportsResponse(data));
  }

  private handleReportsResponse(data: any): void {
    const actualData = Array.isArray(data) ? data : data.reports || [];
    const activeReports = actualData.filter((report: any) =>
      this.activeStatuses.has(report.status),
    );

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
    if (this.map) return;

    // Running map logic outside Angular prevents heavy change detection loops during map interactions
    this.ngZone.runOutsideAngular(() => {
      this.map = L.map('admin-map', { zoomControl: false }).setView([15.145, 120.5887], 13);

      L.control.zoom({ position: 'bottomleft' }).addTo(this.map);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
        updateWhenIdle: true,
        keepBuffer: 2,
      }).addTo(this.map);

      this.markerClusterGroup = L.markerClusterGroup({
        chunkedLoading: true,
        showCoverageOnHover: false,
        spiderfyOnMaxZoom: true,
        maxClusterRadius: 48,
        disableClusteringAtZoom: 17,
        iconCreateFunction: (cluster) => {
          const count = cluster.getChildCount();
          const sizeClass =
            count < 10
              ? 'ac-core-cluster--small'
              : count < 25
                ? 'ac-core-cluster--medium'
                : 'ac-core-cluster--large';

          return L.divIcon({
            html: `
              <div class="ac-core-cluster-shell">
                <div class="ac-core-cluster-pin">
                  <div class="ac-core-cluster-count">${count}</div>
                </div>
              </div>
            `,
            className: `ac-core-cluster ${sizeClass}`,
            iconSize: count < 10 ? [34, 34] : count < 25 ? [40, 40] : [46, 46],
            iconAnchor: count < 10 ? [17, 34] : count < 25 ? [20, 40] : [23, 46],
          });
        },
      });

      this.map.addLayer(this.markerClusterGroup);
      this.refreshMarkers();

      // Load the hazard routing lines after the map and markers are ready
      this.loadRiskPaths();

      setTimeout(() => {
        if (this.map) {
          this.map.invalidateSize();
        }
      }, 100);
    });
  }

  private loadRiskPaths(): void {
    this.hazardReportService
      .getDownstreamRisks()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (risks) => {
          // We run Leaflet modifications outside of Angular to maintain high performance
          this.ngZone.runOutsideAngular(() => {
            if (!this.map) return;

            Object.entries(risks).forEach(([sourceId, group]) => {
              const source = group.find((r) => r._id === sourceId);
              if (!source) return;

              group.forEach((target) => {
                if (target._id !== sourceId) {
                  // Leaflet requires coordinates in [latitude, longitude] order
                  const latlngs: L.LatLngExpression[] = [
                    [source.location.coordinates[1], source.location.coordinates[0]],
                    [target.location.coordinates[1], target.location.coordinates[0]],
                  ];

                  const line = L.polyline(latlngs, {
                    color: '#c03e30', // Bright neon cyan
                    weight: 6, // Thicker line
                    dashArray: '15, 15', // Larger, clearer dashes
                    opacity: 1.0, // Fully opaque and bright
                  }).addTo(this.map!);

                  line.bindPopup(`
                  <div class="p-1 font-sans">
                    <span class="text-xs font-bold text-red-600 uppercase tracking-wider">Geospatial Route</span>
                    <p class="text-sm mt-1">Water flows from <b>${source.title || source.category}</b> down to <b>${target.title || target.category}</b>.</p>
                  </div>
                `);
                }
              });
            });
          });
        },
        error: (err) => console.error('Failed to load risk paths:', err),
      });
  }

  private refreshMarkers(): void {
    if (!this.map || !this.markerClusterGroup) return;

    this.ngZone.runOutsideAngular(() => {
      this.markerClusterGroup!.clearLayers();
      const markers: L.Marker[] = [];

      this.reports().forEach((report) => {
        if (report.location && report.location.coordinates) {
          const lng = report.location.coordinates[0];
          const lat = report.location.coordinates[1];
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

          const verificationCount = report.verifications?.length || 0;

          const popupContent = `
            <div style="font-family: 'Google Sans', sans-serif; display: flex; flex-direction: column; gap: 10px; min-width: 220px; padding-top: 4px;">
              <div style="padding-right: 16px;">
                <h3 style="margin: 0 0 4px 0; font-size: 15px; color: #0f172a; font-weight: 700; line-height: 1.3; word-break: break-word;">
                  ${report.title || report.category || 'Hazard Report'}
                </h3>
                <div style="display: flex; align-items: center; gap: 4px; color: #64748b; font-size: 12px; font-weight: 500;">
                  <span style="text-transform: capitalize;">${report.category || 'Hazard'}</span>
                  <span style="color: #cbd5e1;">&bull;</span>
                  <span>Brgy. ${report.barangay || 'Unknown'}</span>
                </div>
              </div>

              <p style="margin: 0; font-size: 13px; color: #475569; line-height: 1.5; word-wrap: break-word; white-space: normal;">
                ${report.description ? report.description.substring(0, 100) + (report.description.length > 100 ? '...' : '') : 'No description provided.'}
              </p>

              <div style="display: flex; flex-wrap: wrap; gap: 6px; align-items: center; padding-top: 6px; border-top: 1px solid #f1f5f9;">
                <span style="display: inline-flex; align-items: center; gap: 4px; padding: 2px 6px; background-color: ${markerColor}15; color: ${markerColor}; border-radius: 4px; font-size: 10px; font-weight: 700; text-transform: uppercase;">
                  <span style="width: 6px; height: 6px; border-radius: 50%; background-color: ${markerColor};"></span>
                  ${report.severity || 'Unknown'}
                </span>
                
                <span style="padding: 2px 6px; background-color: #f1f5f9; color: #475569; border-radius: 4px; font-size: 10px; font-weight: 700; text-transform: uppercase;">
                  ${report.status || 'Reported'}
                </span>

                ${
                  verificationCount > 0
                    ? `
                  <span style="display: inline-flex; align-items: center; gap: 3px; background-color: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; padding: 1px 6px; border-radius: 4px; font-size: 10px; font-weight: 700;">
                    <svg style="width: 10px; height: 10px;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    ${verificationCount} Verified
                  </span>
                `
                    : ''
                }
              </div>
            </div>
          `;

          markers.push(L.marker([lat, lng], { icon: customIcon }).bindPopup(popupContent));
        }
      });

      this.markerClusterGroup!.addLayers(markers);
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

  focusOnReport(report: any): void {
    if (this.map && report.location && report.location.coordinates) {
      const lng = report.location.coordinates[0];
      const lat = report.location.coordinates[1];

      this.ngZone.runOutsideAngular(() => {
        this.map!.setView([lat, lng], 18, {
          animate: true,
          duration: 0.5,
        });
      });

      if (window.innerWidth < 1024) {
        this.isPanelOpen.set(false);
      }
    }
  }
}
