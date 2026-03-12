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
  
  // Explicit loading flags for zoneless architecture
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
        
        // Tells Angular to update the view immediately
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

  getMarkerColor(severity: string | undefined): string {
    switch(severity?.toLowerCase()) {
      case 'critical': return '#b91c1c'; 
      case 'high': return '#f97316'; 
      case 'medium': return '#facc15'; 
      case 'low': return '#3b82f6'; 
      default: return '#737373'; 
    }
  }

  addMapMarkers(reports: HazardReport[]) {
    if (!this.map) return;

    reports.forEach((report) => {
      if (report.status === 'Resolved') return;

      if (!report.location || !report.location.coordinates || report.location.coordinates.length < 2) {
        console.warn(`Skipping pin rendering for report ${report._id}: Missing valid coordinates.`);
        return; 
      }

      const lng = report.location.coordinates[0];
      const lat = report.location.coordinates[1];
      const color = this.getMarkerColor(report.severity);
      
      const customIcon = L.divIcon({
        className: 'custom-map-marker',
        html: `<div style="background-color: ${color}; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3);"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      });
      
      const popupContent = `
        <div style="font-family: inherit; padding: 12px; display: flex; flex-direction: column; gap: 8px;">
          <div>
            <strong style="font-size: 15px; color: #171717; display: block;">${report.title}</strong>
            <span style="color: #525252; font-size: 12px;">${report.barangay}</span>
          </div>
          
          <div style="display: flex; gap: 6px; margin-top: 4px;">
            <span style="padding: 2px 8px; background-color: ${color}15; color: ${color}; border-radius: 6px; font-size: 10px; font-weight: 800; text-transform: uppercase;">
              ${report.severity || 'Unknown'}
            </span>
            <span style="padding: 2px 8px; background-color: #f5f5f5; color: #525252; border-radius: 6px; font-size: 10px; font-weight: 800; text-transform: uppercase;">
              ${report.category || 'General'}
            </span>
          </div>

          <div style="margin-top: 8px; padding-top: 12px; border-top: 1px solid #e5e5e5; display: flex; align-items: center; justify-content: space-between;">
            <span style="font-size: 11px; color: #737373; font-weight: 600;">2 citizens verified</span>
            <button onclick="alert('Verification feature coming soon!')" style="background-color: #171717; color: white; border: none; padding: 6px 12px; border-radius: 6px; font-size: 11px; font-weight: bold; cursor: pointer;">
              Verify Issue
            </button>
          </div>
        </div>
      `;

      L.marker([lat, lng], { icon: customIcon })
        .bindPopup(popupContent)
        .addTo(this.map!);
    });

    // Forces Leaflet to recalculate its dimensions in case the container shifted
    this.map.invalidateSize();
  }
}