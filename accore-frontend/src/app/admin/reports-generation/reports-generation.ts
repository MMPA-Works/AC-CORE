import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { HazardReportService } from '../../services/hazard-report';
import { BarangayService } from '../../services/barangay';
import { HazardReport } from '../../shared/models/hazard-report';
import { toast } from 'ngx-sonner';

@Component({
  selector: 'app-reports-generation',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './reports-generation.html'
})
export class ReportsGeneration implements OnInit {
  private hazardReportService = inject(HazardReportService);
  private barangayService = inject(BarangayService);
  private fb = inject(FormBuilder);

  isLoading = false;
  allReports: HazardReport[] = [];
  reports: HazardReport[] = [];

  categories: string[] = ['All', 'Pothole', 'Clogged Drain', 'Fallen Tree', 'Streetlight Out', 'Flooding'];
  barangays: string[] = [];
  filteredBarangays: string[] = [];

  reportForm = this.fb.group({
    startDate: [null as string | null],
    endDate: [null as string | null],
    barangay: ['All'],
    category: ['All']
  });

  ngOnInit() {
    this.loadReports();
    this.loadBarangays();

    this.reportForm.get('barangay')?.valueChanges.subscribe(value => {
      this.filterBarangaysList(value || '');
    });
  }

  loadBarangays() {
    const angelesCityBarangays = [
      'Agapito del Rosario', 'Amsic', 'Anunas', 'Balibago', 'Capaya',
      'Claro M. Recto', 'Cuayan', 'Cutcut', 'Cutud', 'Lourdes North West',
      'Lourdes Sur', 'Lourdes Sur East', 'Malabanias', 'Margot', 'Mining',
      'Pampang', 'Pandan', 'Pulung Cacutud', 'Pulung Maragul', 'Pulungbulu',
      'Salapungan', 'San Jose', 'San Nicolas', 'Santa Teresita', 'Santa Trinidad',
      'Santo Cristo', 'Santo Domingo', 'Santo Rosario (Poblacion)', 'Sapalibutad',
      'Sapangbato', 'Tabun', 'Virgen delos Remedios', 'Ninoy Aquino (Marisol)'
    ];

    this.barangays = angelesCityBarangays;
    this.filteredBarangays = [...this.barangays];
  }

  filterBarangaysList(value: string) {
    const filterValue = value.toLowerCase();

    if (filterValue === 'all' || filterValue === '') {
      this.filteredBarangays = this.barangays;
    } else {
      this.filteredBarangays = this.barangays.filter(option =>
        option.toLowerCase().includes(filterValue)
      );
    }
  }

  loadReports() {
    this.isLoading = true;

    this.hazardReportService.getReports().subscribe({
      next: (data: any) => {
        this.allReports = Array.isArray(data) ? data : (data.reports || []);
        this.isLoading = false;
      },
      error: () => {
        toast.error('Failed to load reports');
        this.isLoading = false;
      }
    });
  }

  onFilterReports() {
    const { startDate, endDate, barangay, category } = this.reportForm.value;

    if (!startDate || !endDate) {
      toast.error('Date range required', {
        description: 'Please select both start and end date.'
      });
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const searchBarangay = (barangay || 'All').trim().toLowerCase();
    const searchCategory = (category || 'All').toLowerCase();

    this.reports = this.allReports.filter((r: HazardReport) => {
      const reportDate = new Date(r.createdAt || new Date());

      if (reportDate < start || reportDate > end) return false;

      if (searchBarangay !== 'all' && searchBarangay !== '') {
        const rBarangay = (r.barangay || '').toLowerCase();
        if (!rBarangay.includes(searchBarangay)) return false;
      }

      if (searchCategory !== 'all') {
        const rCategory = (r.category || '').toLowerCase();
        if (rCategory !== searchCategory) return false;
      }

      return true;
    });

    toast.success(`Found ${this.reports.length} reports`);
  }

  getResolvedBy(report: HazardReport): string {
    if (report.statusHistory && report.statusHistory.length > 0) {
      const resolvedStep = [...report.statusHistory]
        .reverse()
        .find(s => s.adminName);

      if (resolvedStep) return resolvedStep.adminName || 'N/A';
    }

    return 'N/A';
  }

  exportToCSV(): void {
    if (!this.reports || this.reports.length === 0) {
      toast.error('No reports to export');
      return;
    }

    const csvData = this.reports.map(r => {
      const coords = r.location?.coordinates || [];

      return {
        Title: (r.title || r.category || 'N/A').replace(/,/g, ' '),
        Category: r.category || 'N/A',
        Barangay: r.barangay || 'N/A',
        Status: r.status || 'Reported',
        'Created At': r.createdAt ? new Date(r.createdAt).toLocaleString() : 'N/A',
        Latitude: coords[1] !== undefined ? coords[1] : 'N/A',
        Longitude: coords[0] !== undefined ? coords[0] : 'N/A',
        'Resolved By': this.getResolvedBy(r)
      };
    });

    const headers = Object.keys(csvData[0]);

    const csvRows = csvData.map(row =>
      headers.map(header =>
        JSON.stringify((row as any)[header])
      ).join(',')
    );

    const csvContent = [headers.join(','), ...csvRows].join('\n');

    const blob = new Blob([csvContent], {
      type: 'text/csv;charset=utf-8;'
    });

    const url = window.URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `Hazard_Reports_Export_${new Date().toISOString().split('T')[0]}.csv`;

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    window.URL.revokeObjectURL(url);

    toast.success('CSV Exported Successfully!');
  }
}