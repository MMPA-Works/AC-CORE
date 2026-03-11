import { Component, OnInit, OnDestroy, inject, signal, PLATFORM_ID } from '@angular/core';
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
})
export class AnalyticsDashboard implements OnInit, OnDestroy {
  private hazardService = inject(HazardReportService);
  private exportService = inject(ExportService);
  private platformId = inject(PLATFORM_ID);

  isLoading = signal<boolean>(true);
  analyticsData = signal<any>(null);
  private map: L.Map | undefined;

  public barChartOptions: ChartConfiguration['options'] = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
  };
  public barChartType: ChartType = 'bar';
  public barChartData: ChartConfiguration['data'] = { labels: [], datasets: [] };

  public doughnutChartOptions: ChartConfiguration['options'] = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: 'right' } }
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
          this.barChartData = {
            labels: data.byBarangay.map((item: any) => item._id),
            datasets: [{ 
              data: data.byBarangay.map((item: any) => item.count), 
              label: 'Hazards', backgroundColor: '#3b82f6', borderRadius: 6 
            }]
          };
        }

        if (data?.bySeverity) {
          const colors: Record<string, string> = { 'Critical': '#ef4444', 'Medium': '#f59e0b', 'Low': '#3b82f6' };
          this.doughnutChartData = {
            labels: data.bySeverity.map((item: any) => item._id),
            datasets: [{ 
              data: data.bySeverity.map((item: any) => item.count),
              backgroundColor: data.bySeverity.map((item: any) => colors[item._id] || '#9ca3af'),
              borderWidth: 0
            }]
          };
        }
        
        this.isLoading.set(false);
        if (isPlatformBrowser(this.platformId)) {
          setTimeout(() => this.initMiniMap(data?.recentActivity || []), 100);
        }
      },
      error: (err) => {
        console.error('Failed to load analytics', err);
        this.isLoading.set(false);
      }
    });
  }

  private initMiniMap(recentReports: any[]) {
    if (this.map) this.map.remove();
    this.map = L.map('mini-map', { zoomControl: false }).setView([15.145, 120.5887], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(this.map);

    recentReports.forEach(report => {
      if (report.location?.coordinates?.length >= 2) {
        // Access array indexes to prevent leaflet rendering failures
        const lng = report.location.coordinates;
        const lat = report.location.coordinates;
        
        L.circleMarker([lat, lng], {
          radius: 6,
          fillColor: '#ef4444',
          color: '#ffffff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.8
        }).addTo(this.map!).bindTooltip(report.title);
      }
    });
  }

  exportData() {
    if (!this.analyticsData()) return;
    const data = this.analyticsData();
    
    // We generate the CSV blob directly here because the ExportService 
    // expects a specific report model, not grouped analytics data.
    const csvRows = ['Category,Name,Count'];
    
    data.byBarangay.forEach((b: any) => csvRows.push(`"Barangay","${b._id}","${b.count}"`));
    data.byStatus.forEach((s: any) => csvRows.push(`"Status","${s._id}","${s.count}"`));
    data.bySeverity.forEach((s: any) => csvRows.push(`"Severity","${s._id}","${s.count}"`));

    const csvString = csvRows.join('\r\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
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