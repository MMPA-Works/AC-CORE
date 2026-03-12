import { Component, inject, OnDestroy, OnInit, PLATFORM_ID, ChangeDetectorRef, AfterViewInit, ViewChild, ElementRef, ViewEncapsulation } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HazardReportService } from '../../services/hazard-report';
import { HazardReport } from '../../shared/models/hazard-report';
import { AuthService } from '../../shared/auth';
import { CitizenHeaderComponent } from '../components/citizen-header/citizen-header';
import * as L from 'leaflet';
import 'leaflet.markercluster';

@Component({
  selector: 'app-citizen-dashboard',
  standalone: true,
  imports: [RouterModule, CommonModule, CitizenHeaderComponent],
  templateUrl: './dashboard.html',
  encapsulation: ViewEncapsulation.None,
  styles: [`
    .leaflet-popup-content-wrapper {
      border-radius: 12px;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    }
    .leaflet-popup-content {
      margin: 0;
      width: 240px !important;
    }
    .ac-core-cluster {
      background: transparent;
      border: 0;
    }
    .ac-core-cluster-shell {
      display: flex;
      height: 100%;
      justify-content: center;
      align-items: flex-start;
      width: 100%;
    }
    .ac-core-cluster-pin {
      align-items: center;
      background: linear-gradient(135deg, #cf2e1d 0%, #ac1001 68%, #7f0c01 100%);
      border: 2px solid rgba(255, 255, 255, 0.95);
      border-radius: 50% 50% 50% 0;
      box-shadow: 0 14px 28px rgba(127, 12, 1, 0.28);
      display: flex;
      justify-content: center;
      position: relative;
      transform: rotate(-45deg);
      width: 100%;
      height: 100%;
    }
    .ac-core-cluster-pin::before {
      background: rgba(172, 16, 1, 0.22);
      border-radius: 50% 50% 50% 0;
      content: '';
      inset: -5px;
      position: absolute;
      z-index: -1;
    }
    .ac-core-cluster-count {
      align-items: center;
      color: #ffffff;
      display: flex;
      font-weight: 800;
      justify-content: center;
      letter-spacing: -0.02em;
      transform: rotate(45deg);
    }
    .ac-core-cluster--small {
      height: 34px;
      width: 34px;
    }
    .ac-core-cluster--small .ac-core-cluster-count {
      font-size: 11px;
    }
    .ac-core-cluster--medium {
      height: 40px;
      width: 40px;
    }
    .ac-core-cluster--medium .ac-core-cluster-pin {
      background: linear-gradient(135deg, #d83b29 0%, #b51202 65%, #870d01 100%);
      box-shadow: 0 18px 34px rgba(127, 12, 1, 0.3);
    }
    .ac-core-cluster--medium .ac-core-cluster-pin::before {
      background: rgba(172, 16, 1, 0.24);
      inset: -6px;
    }
    .ac-core-cluster--medium .ac-core-cluster-count {
      font-size: 12px;
    }
    .ac-core-cluster--large {
      height: 46px;
      width: 46px;
    }
    .ac-core-cluster--large .ac-core-cluster-pin {
      background: linear-gradient(135deg, #bf1b0b 0%, #930d01 70%, #650900 100%);
      box-shadow: 0 22px 38px rgba(96, 7, 0, 0.34);
    }
    .ac-core-cluster--large .ac-core-cluster-pin::before {
      background: rgba(127, 12, 1, 0.28);
      inset: -7px;
    }
    .ac-core-cluster--large .ac-core-cluster-count {
      font-size: 14px;
    }
  `]
})
export class Dashboard implements OnInit, AfterViewInit, OnDestroy {
  private hazardReportService = inject(HazardReportService);
  private authService = inject(AuthService);
  private platformId = inject(PLATFORM_ID);
  private cdr = inject(ChangeDetectorRef);

  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;
  private map: L.Map | undefined;
  private markerClusterGroup: L.MarkerClusterGroup | undefined;

  myReports: HazardReport[] = [];
  isRecentLoading = true;
  isInsightsLoading = true;
  totalReports = 0;
  resolvedReports = 0;
  impactTitle = 'Civic Starter';
  firstName = 'Citizen';
  cityInsights: { category: string, percentage: number }[] = [];

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.firstName = this.authService.getFirstName() || 'Citizen';
      this.fetchMyReports();
    }
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        this.initMap();
        this.fetchCityMapData();
      }, 100);
    }
  }

  ngOnDestroy(): void {
    this.markerClusterGroup?.clearLayers();
    this.map?.remove();
  }

  fetchMyReports() {
    this.hazardReportService.getReports().subscribe({
      next: (data) => {
        this.totalReports = data.length;
        this.resolvedReports = data.filter((report) => report.status === 'Resolved').length;
        this.calculateImpactRank(this.totalReports);
        this.myReports = data.slice(0, 3);
        this.isRecentLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Failed to fetch personal reports', error);
        this.isRecentLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  fetchCityMapData() {
    this.hazardReportService.getAllPublicReports().subscribe({
      next: (data) => {
        this.isInsightsLoading = false;
        this.calculateCityInsights(data);

        if (this.map) {
          this.addMapMarkers(data);
        }

        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Failed to load public city reports', error);
        this.isInsightsLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  calculateCityInsights(reports: HazardReport[]) {
    if (!reports || reports.length === 0) {
      this.cityInsights = [];
      return;
    }

    const counts: Record<string, number> = {};

    reports.forEach((report) => {
      const category = report.category || 'Other';
      counts[category] = (counts[category] || 0) + 1;
    });

    const total = reports.length;

    this.cityInsights = Object.entries(counts)
      .map(([category, count]) => ({
        category,
        percentage: Math.round((count / total) * 100)
      }))
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 3);
  }

  calculateImpactRank(count: number) {
    if (count === 0) {
      this.impactTitle = 'Civic Observer';
    } else if (count < 5) {
      this.impactTitle = 'Active Contributor';
    } else if (count < 15) {
      this.impactTitle = 'City Guardian';
    } else {
      this.impactTitle = 'Elite Sentinel';
    }
  }

  initMap() {
    if (!this.mapContainer || this.map) {
      return;
    }

    this.map = L.map(this.mapContainer.nativeElement, {
      zoomControl: false
    }).setView([15.145, 120.588], 13);

    L.control.zoom({
      position: 'topright'
    }).addTo(this.map);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    this.markerClusterGroup = L.markerClusterGroup({
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: true,
      maxClusterRadius: 48,
      disableClusteringAtZoom: 17,
      iconCreateFunction: (cluster) => {
        const count = cluster.getChildCount();
        const sizeClass = count < 10
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
  }

  getMarkerColor(severity: string | undefined): string {
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

  addMapMarkers(reports: HazardReport[]) {
    if (!this.map || !this.markerClusterGroup) {
      return;
    }

    this.markerClusterGroup.clearLayers();
    const markers: L.Marker[] = [];

    reports.forEach((report) => {
      if (!report.location || !report.location.coordinates || report.location.coordinates.length < 2) {
        return;
      }

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
        popupAnchor: [0, -32]
      });

      const popupContent = `
        <div style="font-family: 'Google Sans', sans-serif; padding: 12px; display: flex; flex-direction: column; gap: 8px;">
          <div>
            <strong style="font-size: 16px; color: #171717; display: block; text-transform: capitalize;">${report.category || 'Hazard'}</strong>
            <span style="color: #525252; font-size: 12px;">Brgy. ${report.barangay}</span>
          </div>

          <div style="display: flex; gap: 6px; margin-top: 4px;">
            <span style="padding: 2px 8px; background-color: ${markerColor}15; color: ${markerColor}; border-radius: 6px; font-size: 10px; font-weight: 800; text-transform: uppercase;">
              ${report.severity || 'Unknown'} Severity
            </span>
            <span style="padding: 2px 8px; background-color: #f3f4f6; color: #525252; border-radius: 6px; font-size: 10px; font-weight: 800; text-transform: uppercase;">
              ${report.status || 'Reported'}
            </span>
          </div>

          <div style="margin-top: 8px; padding-top: 12px; border-top: 1px solid #e5e5e5; display: flex; align-items: center; justify-content: space-between;">
            <span style="font-size: 11px; color: #737373; font-weight: 600;">2 citizens verified</span>
            <button onclick="alert('Verification feature coming soon!')" style="background-color: #171717; color: white; border: none; padding: 6px 12px; border-radius: 6px; font-size: 11px; font-weight: bold; cursor: pointer; font-family: 'Google Sans', sans-serif;">
              Verify
            </button>
          </div>
        </div>
      `;

      markers.push(
        L.marker([lat, lng], { icon: customIcon }).bindPopup(popupContent)
      );
    });

    this.markerClusterGroup.addLayers(markers);
    this.map.invalidateSize();
  }
}
