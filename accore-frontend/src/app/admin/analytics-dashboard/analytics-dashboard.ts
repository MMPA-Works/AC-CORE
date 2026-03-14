import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  PLATFORM_ID,
  computed,
  NgZone,
  ViewEncapsulation,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HazardReportService } from '../../services/hazard-report';
import { ExportService } from '../../services/export';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartType } from 'chart.js';
import * as L from 'leaflet';
import 'leaflet.markercluster';

import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { HlmScrollAreaImports } from '@spartan-ng/helm/scroll-area';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-analytics-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    BaseChartDirective,
    HlmCardImports,
    HlmButtonImports,
    HlmBadgeImports,
    HlmScrollAreaImports,
    LucideAngularModule,
  ],
  templateUrl: './analytics-dashboard.html',
  styleUrls: ['./analytics-dashboard.css'], // Linking the new CSS file here
  encapsulation: ViewEncapsulation.None,
})
export class AnalyticsDashboard implements OnInit, OnDestroy {
  private hazardService = inject(HazardReportService);
  private exportService = inject(ExportService);
  private platformId = inject(PLATFORM_ID);
  private ngZone = inject(NgZone);

  maxReportCount = signal<number>(1);
  totalReports = signal<number>(0);
  isLoading = signal<boolean>(true);
  analyticsData = signal<any>(null);

  activeHazardsCount = computed(() => this.analyticsData()?.totalActive || 0);
  criticalAlertsCount = computed(() => this.getSeverityCount('Critical'));
  underReviewCount = computed(() => this.getStatusCount('Under Review'));
  inProgressCount = computed(() => this.getStatusCount('In Progress'));
  resolvedCount = computed(() => this.getStatusCount('Resolved'));

  resolutionRate = computed(() => {
    const total = this.totalReports();
    const resolved = this.resolvedCount();
    if (total === 0) return 0;
    return Math.round((resolved / total) * 100);
  });

  topBarangays = computed(() => {
    const data = this.analyticsData()?.byBarangay || [];
    return data.slice(0, 5);
  });

  recentActivityList = computed(() => {
    const data = this.analyticsData()?.recentActivity || [];
    return data.slice(0, 5);
  });
  
  private map: L.Map | undefined;
  private markerClusterGroup: L.MarkerClusterGroup | undefined;

  public doughnutChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    layout: { padding: 16 },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        titleColor: '#0f172a',
        bodyColor: '#475569',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        padding: 12,
        boxPadding: 8,
        cornerRadius: 12,
        usePointStyle: true,
        titleFont: { size: 14, family: "'Inter', sans-serif" },
        bodyFont: { size: 13, family: "'Inter', sans-serif" },
        callbacks: {
          label: (context) => ` ${context.label}: ${context.raw} Reports`,
        },
      },
    },
  };
  public doughnutChartType: ChartType = 'doughnut';
  public doughnutChartData: ChartConfiguration['data'] = { labels: [], datasets: [] };

  ngOnInit() {
    this.fetchAnalytics();
  }

  ngOnDestroy() {
    if (this.markerClusterGroup) {
      this.markerClusterGroup.clearLayers();
    }
    if (this.map) {
      this.map.remove();
    }
  }

  fetchAnalytics() {
    this.isLoading.set(true);
    this.hazardService.getAnalytics().subscribe({
      next: (data) => {
        if (data?.bySeverity) {
          data.bySeverity.sort((a: any, b: any) => b.count - a.count);
        }

        this.analyticsData.set(data);
        
        if (data?.byBarangay) {
          const counts = data.byBarangay.map((item: any) => item.count);
          this.maxReportCount.set(Math.max(...counts, 1));
        }

        if (data?.bySeverity) {
          const themeColors: Record<string, string> = {
            Critical: '#d93829',
            Medium: '#f07c2b',
            Low: '#f9a842',
          };

          const counts = data.bySeverity.map((item: any) => item.count);
          this.totalReports.set(counts.reduce((a: number, b: number) => a + b, 0));

          this.doughnutChartData = {
            labels: data.bySeverity.map((item: any) => item._id),
            datasets: [
              {
                data: counts,
                backgroundColor: data.bySeverity.map(
                  (item: any) => themeColors[item._id] || '#9ca3af',
                ),
                borderWidth: 0,
                hoverOffset: 8,
              },
            ],
          };
        }
        
        this.isLoading.set(false);
        if (isPlatformBrowser(this.platformId)) {
          setTimeout(() => this.initMiniMap(data?.activeHotspots || []), 100);
        }
      },
      error: (err) => {
        console.error('Failed to load analytics', err);
        this.isLoading.set(false);
      },
    });
  }

  private initMiniMap(hotspots: any[]) {
    if (this.map) return;

    this.ngZone.runOutsideAngular(() => {
      this.map = L.map('mini-map', { zoomControl: false }).setView([15.145, 120.5887], 13);

      L.control.zoom({ position: 'bottomright' }).addTo(this.map);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(this.map);

      this.markerClusterGroup = L.markerClusterGroup({
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
            html: `<div class="ac-core-cluster-shell"><div class="ac-core-cluster-pin"><div class="ac-core-cluster-count">${count}</div></div></div>`,
            className: `ac-core-cluster ${sizeClass}`,
            iconSize: count < 10 ? [34, 34] : count < 25 ? [40, 40] : [46, 46],
            iconAnchor: count < 10 ? [17, 34] : count < 25 ? [20, 40] : [23, 46],
          });
        },
      });

      this.map.addLayer(this.markerClusterGroup);
      const markers: L.Marker[] = [];

      hotspots.forEach((report) => {
        if (report.location?.coordinates?.length >= 2) {
          const lng = report.location.coordinates[0];
          const lat = report.location.coordinates[1];
          const markerColor = this.getMarkerColor(report.severity);

          const customIcon = L.divIcon({
            className: 'bg-transparent border-0',
            html: `
            <div style="position: relative; display: flex; justify-content: center; align-items: center; width: 32px; height: 32px; transition: transform 0.2s ease-in-out;" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
              <div style="width: 24px; height: 24px; background-color: ${markerColor}; border: 2px solid white; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); box-shadow: 0 4px 10px rgba(0,0,0,0.2); display: flex; justify-content: center; align-items: center; z-index: 10;">
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

              <div style="display: flex; flex-wrap: wrap; gap: 6px; align-items: center; padding-top: 6px; border-top: 1px solid #f1f5f9;">
                <span style="display: inline-flex; align-items: center; gap: 4px; padding: 2px 6px; background-color: ${markerColor}15; color: ${markerColor}; border-radius: 4px; font-size: 10px; font-weight: 700; text-transform: uppercase;">
                  <span style="width: 6px; height: 6px; border-radius: 50%; background-color: ${markerColor};"></span>
                  ${report.severity || 'Unknown'}
                </span>
                
                <span style="padding: 2px 6px; background-color: #f1f5f9; color: #475569; border-radius: 4px; font-size: 10px; font-weight: 700; text-transform: uppercase;">
                  ${report.status || 'Active'}
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

      this.markerClusterGroup.addLayers(markers);
      
      this.loadRiskPaths();

      setTimeout(() => {
        if (this.map) this.map.invalidateSize();
      }, 500);
    });
  }

  private loadRiskPaths(): void {
    this.hazardService.getDownstreamRisks().subscribe({
      next: (risks) => {
        this.ngZone.runOutsideAngular(() => {
          if (!this.map) return;

          Object.entries(risks).forEach(([sourceId, group]) => {
            const source = group.find((r: any) => r._id === sourceId);
            if (!source) return;

            group.forEach((target: any) => {
              if (target._id !== sourceId) {
                const latlngs: L.LatLngExpression[] = [
                  [source.location.coordinates[1], source.location.coordinates[0]],
                  [target.location.coordinates[1], target.location.coordinates[0]]
                ];

                const line = L.polyline(latlngs, {
                  color: '#c03e30',
                  weight: 4,
                  dashArray: '10, 10',
                  opacity: 0.9
                }).addTo(this.map!);

                // Improved the description here to be highly informative
                line.bindPopup(`
                  <div class="p-1 font-sans">
                    <span class="text-[10px] font-bold text-[#c03e30] uppercase tracking-wider">Geospatial Flow Risk</span>
                    <p class="text-xs mt-1 font-medium text-gray-700 leading-relaxed">
                      Predictive routing indicates a downstream water flow from <b>${source.title || source.category}</b> directly affecting <b>${target.title || target.category}</b>.
                    </p>
                  </div>
                `);
              }
            });
          });
        });
      },
      error: (err) => console.error('Failed to load risk paths:', err)
    });
  }

  private getMarkerColor(severity: string | undefined): string {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return '#d93829';
      case 'medium':
      case 'high':
        return '#f07c2b';
      case 'low':
        return '#f9a842';
      default:
        return '#737373';
    }
  }

  exportData() {
    if (!this.analyticsData()) return;
    const data = this.analyticsData();
    const csvRows = ['Category,Name,Count'];
    data.byBarangay.forEach((b: any) => csvRows.push(`"Barangay","${b._id}","${b.count}"`));
    data.byStatus.forEach((s: any) => csvRows.push(`"Status","${s._id}","${s.count}"`));
    data.bySeverity.forEach((s: any) => csvRows.push(`"Severity","${s._id}","${s.count}"`));
    const blob = new Blob([csvRows.join('\r\n')], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'angeles_hazard_analytics.csv';
    link.click();
  }

  getStatusCount(statusName: string): number {
    const statusArray = this.analyticsData()?.byStatus || [];
    const found = statusArray.find((s: any) => s._id === statusName);
    return found ? found.count : 0;
  }

  getSeverityCount(severityName: string): number {
    const severityArray = this.analyticsData()?.bySeverity || [];
    const found = severityArray.find((s: any) => s._id === severityName);
    return found ? found.count : 0;
  }
}