import { Component, OnInit, OnDestroy, inject, signal, PLATFORM_ID, computed } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HazardReportService } from '../../services/hazard-report';
import { ExportService } from '../../services/export';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartType } from 'chart.js';
import * as L from 'leaflet';

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
    LucideAngularModule
  ],
  templateUrl: './analytics-dashboard.html',
  styleUrl: './analytics-dashboard.css',
})
export class AnalyticsDashboard implements OnInit, OnDestroy {
  private hazardService = inject(HazardReportService);
  private exportService = inject(ExportService);
  private platformId = inject(PLATFORM_ID);

  maxReportCount = signal<number>(1);
  totalReports = signal<number>(0);
  isLoading = signal<boolean>(true);
  analyticsData = signal<any>(null);

  // Limit to top 6 barangays to keep the dashboard height consistent
  topBarangays = computed(() => {
    const data = this.analyticsData()?.byBarangay || [];
    return data.slice(0, 6);
  });
  
  private map: L.Map | undefined;

  public doughnutChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    },
  };
  public doughnutChartType: ChartType = 'doughnut';
  public doughnutChartData: ChartConfiguration['data'] = { labels: [], datasets: [] };

  ngOnInit() {
    this.fetchAnalytics();
  }

  ngOnDestroy() {
    if (this.map) this.map.remove();
  }

  fetchAnalytics() {
    this.isLoading.set(true);
    this.hazardService.getAnalytics().subscribe({
      next: (data) => {
        this.analyticsData.set(data);
        
        if (data?.byBarangay) {
          const counts = data.byBarangay.map((item: any) => item.count);
          this.maxReportCount.set(Math.max(...counts, 1));
        }

        if (data?.bySeverity) {
          const themeColors: Record<string, string> = {
            'Critical': '#822a22',
            'Medium': '#c49a3f',  
            'Low': '#cbd5e1'      
          };

          const counts = data.bySeverity.map((item: any) => item.count);
          this.totalReports.set(counts.reduce((a: number, b: number) => a + b, 0));

          this.doughnutChartData = {
            labels: data.bySeverity.map((item: any) => item._id),
            datasets: [{
              data: counts,
              backgroundColor: data.bySeverity.map((item: any) => themeColors[item._id] || '#9ca3af'),
              borderWidth: 0,
              hoverOffset: 12
            }]
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
      }
    });
  }

  private initMiniMap(hotspots: any[]) {
    if (this.map) this.map.remove();
    this.map = L.map('mini-map', { zoomControl: false }).setView([15.145, 120.5887], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(this.map);

    hotspots.forEach(report => {
      if (report.location?.coordinates?.length >= 2) {
        const [lng, lat] = report.location.coordinates;
        const colors: Record<string, string> = { 'Critical': '#822a22', 'Medium': '#c49a3f', 'Low': '#64748b' };
        const pinColor = colors[report.severity] || colors['Medium'];

        const pulseStyle = report.severity === 'Critical'
          ? `<div style="position: absolute; width: 40px; height: 40px; background: ${pinColor}; border-radius: 50%; opacity: 0.4; animation: mapPulse 2s infinite ease-out;"></div>`
          : '';

        const customIcon = L.divIcon({
          className: '',
          html: `<div style="position: relative; display: flex; justify-content: center; align-items: center; width: 32px; height: 32px;">
                  ${pulseStyle}
                  <div style="width: 24px; height: 24px; background-color: ${pinColor}; border: 2px solid white; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); box-shadow: 0 3px 6px rgba(0,0,0,0.3); display: flex; justify-content: center; align-items: center; z-index: 10;">
                    <div style="width: 8px; height: 8px; background: white; border-radius: 50%; transform: rotate(45deg);"></div>
                  </div>
                </div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 32]
        });

        L.marker([lat, lng], { icon: customIcon })
          .addTo(this.map!)
          .bindTooltip(`<b>${report.title}</b><br><span style="color:${pinColor}">${report.severity}</span>`, { direction: 'top', offset: [0, -30] });
      }
    });
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
}
