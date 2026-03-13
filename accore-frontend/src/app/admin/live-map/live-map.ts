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

      setTimeout(() => {
        if (this.map) {
          this.map.invalidateSize();
        }
      }, 100);
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

          const popupContent = `
            <div style="font-family: 'Google Sans', sans-serif; padding: 12px; display: flex; flex-direction: column; gap: 8px;">
              <div>
                <strong style="font-size: 16px; color: #171717; display: block; margin-bottom: 2px; text-transform: capitalize;">
                  ${report.title || 'Hazard Report'}
                </strong>
                <div style="display: flex; align-items: center; gap: 6px;">
                  <span style="color: #525252; font-size: 12px; font-weight: 500; text-transform: capitalize;">
                    ${report.category || 'Hazard'}
                  </span>
                  <span style="color: #d4d4d8; font-size: 12px;">•</span>
                  <span style="color: #525252; font-size: 12px;">Brgy. ${report.barangay}</span>
                </div>
              </div>

              <div style="display: flex; gap: 6px; margin-top: 4px;">
                <span style="padding: 2px 8px; background-color: ${markerColor}15; color: ${markerColor}; border-radius: 6px; font-size: 10px; font-weight: 800; text-transform: uppercase;">
                  ${report.severity || 'Unknown'} Severity
                </span>
                <span style="padding: 2px 8px; background-color: #f3f4f6; color: #525252; border-radius: 6px; font-size: 10px; font-weight: 800; text-transform: uppercase;">
                  ${report.status || 'Reported'}
                </span>
              </div>

              <div style="margin-top: 8px; padding-top: 12px; border-top: 1px solid #e5e5e5;">
                <span style="font-size: 12px; color: #525252;">${report.description || 'No description provided.'}</span>
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
