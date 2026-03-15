import {
  Component,
  inject,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  ChangeDetectorRef,
  AfterViewInit,
  ViewChild,
  ElementRef,
  ViewEncapsulation,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HazardReportService } from '../../services/hazard-report';
import { HazardReport } from '../../shared/models/hazard-report';
import { AuthService } from '../../shared/auth';
import { CitizenHeaderComponent } from '../components/citizen-header/citizen-header';
import { CitizenFooterComponent } from '../components/citizen-footer/citizen-footer';
import { HttpClient } from '@angular/common/http';
import * as L from 'leaflet';
import 'leaflet.markercluster';

// Fixes the missing marker images in production builds
L.Icon.Default.imagePath = 'https://unpkg.com/leaflet@1.9.4/dist/images/';

import { HlmToasterImports } from '@spartan-ng/helm/sonner';
import { toast } from 'ngx-sonner';

@Component({
  selector: 'app-citizen-dashboard',
  standalone: true,
  imports: [RouterModule, CommonModule, CitizenHeaderComponent, CitizenFooterComponent, HlmToasterImports],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
  encapsulation: ViewEncapsulation.None,
})
export class Dashboard implements OnInit, AfterViewInit, OnDestroy {
  private hazardReportService = inject(HazardReportService);
  private authService = inject(AuthService);
  private platformId = inject(PLATFORM_ID);
  private cdr = inject(ChangeDetectorRef);
  private http = inject(HttpClient);

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
  currentUserId: string | null = null;
  cityInsights: { category: string; count: number; weeklyCount: number; percentage: number }[] = [];

  weather: any = null;

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.firstName = this.authService.getFirstName('citizen') || 'Citizen';
      this.currentUserId = this.authService.getUserId('citizen');
      this.fetchMyReports();
      this.fetchWeather();
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

  fetchWeather() {
    this.http.get('http://localhost:5000/api/weather').subscribe({
      next: (data) => {
        this.weather = data;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load weather widget data', err);
      },
    });
  }

  fetchMyReports() {
    this.hazardReportService.getReports().subscribe({
      next: (data) => {
        this.totalReports = data.length;
        this.resolvedReports = data.filter((report) => report.status === 'Resolved').length;
        this.calculateImpactRank(this.totalReports);
        this.myReports = data.slice(0, 4);
        this.isRecentLoading = false;
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.error('Failed to fetch personal reports', error);
        this.isRecentLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  fetchCityMapData() {
    this.hazardReportService.getAllPublicReports().subscribe({
      next: (data) => {
        this.calculateCityInsights(data);
        this.isInsightsLoading = false;
        
        if (this.map) {
          this.addMapMarkers(data);
        }
        
        // Forces Angular to update the HTML immediately after data arrives
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.error('Failed to load public city reports', error);
        this.isInsightsLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  calculateCityInsights(reports: HazardReport[]) {
    if (!reports || reports.length === 0) {
      this.cityInsights = [];
      return;
    }

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const counts: Record<string, { count: number; weeklyCount: number }> = {};

    reports.forEach((report) => {
      const category = report.category || 'Other';
      const createdAt = report.createdAt ? new Date(report.createdAt) : null;

      if (!counts[category]) {
        counts[category] = { count: 0, weeklyCount: 0 };
      }

      counts[category].count += 1;

      if (createdAt && !Number.isNaN(createdAt.getTime()) && createdAt >= oneWeekAgo) {
        counts[category].weeklyCount += 1;
      }
    });

    const total = reports.length;

    this.cityInsights = Object.entries(counts)
      .map(([category, values]) => ({
        category,
        count: values.count,
        weeklyCount: values.weeklyCount,
        percentage: Math.round((values.count / total) * 100),
      }))
      .sort((a, b) => b.count - a.count)
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
    if (!this.mapContainer || this.map) return;

    this.map = L.map(this.mapContainer.nativeElement, {
      zoomControl: false,
    }).setView([15.145, 120.588], 13);

    L.control.zoom({ position: 'bottomright' }).addTo(this.map);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors',
    }).addTo(this.map);

    this.markerClusterGroup = L.markerClusterGroup({
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: true,
      maxClusterRadius: 48,
      disableClusteringAtZoom: 17,
      iconCreateFunction: (cluster) => {
        const count = cluster.getChildCount();
        const sizeClass = count < 10 ? 'ac-core-cluster--small' : count < 25 ? 'ac-core-cluster--medium' : 'ac-core-cluster--large';
        return L.divIcon({
          html: `<div class="ac-core-cluster-shell"><div class="ac-core-cluster-pin"><div class="ac-core-cluster-count">${count}</div></div></div>`,
          className: `ac-core-cluster ${sizeClass}`,
          iconSize: count < 10 ? [34, 34] : count < 25 ? [40, 40] : [46, 46],
          iconAnchor: count < 10 ? [17, 34] : count < 25 ? [20, 40] : [23, 46],
        });
      },
    });

    this.map.addLayer(this.markerClusterGroup);

    this.map.on('popupopen', (e: any) => {
      const popupNode = e.popup.getElement();
      const verifyBtn = popupNode.querySelector('.verify-btn');

      if (verifyBtn) {
        verifyBtn.addEventListener('click', (event: Event) => {
          const target = event.target as HTMLElement;
          const reportId = target.getAttribute('data-report-id');
          if (reportId) {
            this.handleVerifyClick(reportId, target);
          }
        });
      }
    });
  }

  handleVerifyClick(reportId: string, buttonElement: HTMLElement) {
    const isCurrentlyVerified = buttonElement.innerText === 'Verified';

    buttonElement.style.opacity = '0.5';
    buttonElement.style.pointerEvents = 'none';
    buttonElement.innerText = 'Updating...';

    this.hazardReportService.toggleVerify(reportId).subscribe({
      next: () => {
        this.fetchCityMapData();
        if (isCurrentlyVerified) {
          toast.success('Report unverified successfully!');
        } else {
          toast.success('Report verified successfully!');
        }
      },
      error: (err: any) => {
        console.error('Failed to toggle verification', err);
        toast.error('Failed to update verification. Please try again.');
      },
      complete: () => {
        buttonElement.style.opacity = '1';
        buttonElement.style.pointerEvents = 'auto';
        buttonElement.innerText = isCurrentlyVerified ? 'Verify Issue' : 'Verified';
      },
    });
  }

  getMarkerColor(severity: string | undefined): string {
    switch (severity?.toLowerCase()) {
      case 'critical': return '#dc2626';
      case 'medium': 
      case 'high': return '#f97316';
      case 'low': return '#eab308';
      default: return '#737373';
    }
  }

  addMapMarkers(reports: HazardReport[]) {
    if (!this.map || !this.markerClusterGroup) return;

    this.markerClusterGroup.clearLayers();
    const markers: L.Marker[] = [];

    reports.forEach((report) => {
      if (!report.location || !report.location.coordinates || report.location.coordinates.length < 2) return;

      const lng = report.location.coordinates[0];
      const lat = report.location.coordinates[1];
      const markerColor = this.getMarkerColor(report.severity);
      const verifications = report.verifications || [];
      const verificationCount = verifications.length;
      const hasVerified = this.currentUserId ? verifications.includes(this.currentUserId) : false;

      const customIcon = L.divIcon({
        className: 'bg-transparent border-0',
        html: `<div style="position: relative; display: flex; justify-content: center; align-items: center; width: 32px; height: 32px; transition: transform 0.2s ease-in-out;" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
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
            <span style="font-size: 11px; color: #737373; font-weight: 600;">${verificationCount} citizens verified</span>
            <button class="verify-btn" data-report-id="${report._id}"
              style="background-color: ${hasVerified ? '#16a34a' : '#171717'}; color: white; border: none; padding: 6px 12px; border-radius: 6px; font-size: 11px; font-weight: bold; cursor: pointer; font-family: 'Google Sans', sans-serif; transition: background-color 0.2s;">
              ${hasVerified ? 'Verified' : 'Verify Issue'}
            </button>
          </div>
        </div>`;

      markers.push(L.marker([lat, lng], { icon: customIcon }).bindPopup(popupContent));
    });

    this.markerClusterGroup.addLayers(markers);
    this.map.invalidateSize();
  }
}