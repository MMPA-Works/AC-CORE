import { Component, inject, OnInit, PLATFORM_ID, ChangeDetectorRef, AfterViewInit, ViewChild, ElementRef, ViewEncapsulation } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HazardReportService } from '../../services/hazard-report';
import { HazardReport } from '../../shared/models/hazard-report';
import { CitizenHeaderComponent } from '../components/citizen-header/citizen-header';
import * as L from 'leaflet';

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
  `]
})
export class Dashboard implements OnInit, AfterViewInit {
  private hazardReportService = inject(HazardReportService);
  private platformId = inject(PLATFORM_ID);
  private cdr = inject(ChangeDetectorRef);

  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;
  private map: L.Map | undefined;

  myReports: HazardReport[] = [];
  
  isRecentLoading = true;
  isInsightsLoading = true;
  
  totalReports = 0;
  resolvedReports = 0;
  impactTitle = 'Civic Starter';

  cityInsights: { category: string, percentage: number }[] = [];

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
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

  fetchMyReports() {
    this.hazardReportService.getReports().subscribe({
      next: (data) => {
        this.totalReports = data.length;
        this.resolvedReports = data.filter(r => r.status === 'Resolved').length;
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
    
    reports.forEach(report => {
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
    if (!this.mapContainer || this.map) return;

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
  }

  getMarkerStyle(severity: string | undefined): { bgClass: string, hex: string } {
    switch(severity?.toLowerCase()) {
      case 'critical': return { bgClass: 'bg-red-600', hex: '#dc2626' };
      case 'medium': return { bgClass: 'bg-yellow-500', hex: '#eab308' };
      case 'low': return { bgClass: 'bg-neutral-500', hex: '#737373' };
      default: return { bgClass: 'bg-neutral-500', hex: '#737373' };
    }
  }

  addMapMarkers(reports: HazardReport[]) {
    if (!this.map) return;

    reports.forEach((report) => {
      if (report.status === 'Resolved') return;

      if (!report.location || !report.location.coordinates || report.location.coordinates.length < 2) {
        return; 
      }

      const lng = report.location.coordinates[0];
      const lat = report.location.coordinates[1];
      const style = this.getMarkerStyle(report.severity);
      
      // Exact copy of the analytics pin marker WITHOUT the pulse effect
      const customIcon = L.divIcon({
        className: 'bg-transparent border-0',
        html: `
        <div style="position: relative; display: flex; justify-content: center; align-items: center; width: 32px; height: 32px; transition: transform 0.2s ease-in-out;" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
          <div style="width: 24px; height: 24px; background-color: ${style.hex}; border: 2px solid white; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); box-shadow: 0 3px 6px rgba(0,0,0,0.3); display: flex; justify-content: center; align-items: center; z-index: 10;">
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
            <span style="padding: 2px 8px; background-color: ${style.hex}15; color: ${style.hex}; border-radius: 6px; font-size: 10px; font-weight: 800; text-transform: uppercase;">
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

      L.marker([lat, lng], { icon: customIcon })
        .bindPopup(popupContent)
        .addTo(this.map!);
    });

    this.map.invalidateSize();
  }
}