import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormsModule } from '@angular/forms';
import { HazardReportService } from '../../services/hazard-report';
import { BarangayService } from '../../services/barangay';
import { HazardReport } from '../../shared/models/hazard-report';
import { toast } from 'ngx-sonner';

// Spartan Imports
import { BrnSelectImports } from '@spartan-ng/brain/select';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmTableImports } from '@spartan-ng/helm/table';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { HlmScrollAreaImports } from '@spartan-ng/helm/scroll-area';
import { HlmDatePicker } from '@spartan-ng/helm/date-picker';
import { HlmLabel } from '@spartan-ng/helm/label';

@Component({
  selector: 'app-reports-generation',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    BrnSelectImports,
    HlmSelectImports,
    HlmButtonImports,
    HlmTableImports,
    HlmBadgeImports,
    HlmScrollAreaImports,
    HlmDatePicker,
    HlmLabel
  ],
  templateUrl: './reports-generation.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReportsGeneration implements OnInit {
  private hazardReportService = inject(HazardReportService);
  private fb = inject(FormBuilder);

  isLoading = false;
  allReports: HazardReport[] = [];
  reports: HazardReport[] = [];

  categories: string[] = ['All', 'Pothole', 'Clogged Drain', 'Fallen Tree', 'Streetlight Out', 'Flooding'];
  barangays: string[] = [];
  filteredBarangays: string[] = [];

  // Date Picker Bindings
  public startDate: Date | undefined = undefined;
  public endDate: Date | undefined = undefined;
  public minDate = new Date(2023, 0, 1);
  public maxDate = new Date(2030, 11, 31);

  reportForm = this.fb.group({
    barangay: ['All'],
    category: ['All']
  });

  ngOnInit() {
    this.loadReports();
    this.loadBarangays();
  }

  loadBarangays() {
    this.barangays = [
      'Agapito del Rosario', 'Amsic', 'Anunas', 'Balibago', 'Capaya',
      'Claro M. Recto', 'Cuayan', 'Cutcut', 'Cutud', 'Lourdes North West',
      'Lourdes Sur', 'Lourdes Sur East', 'Malabanias', 'Margot', 'Mining',
      'Pampang', 'Pandan', 'Pulung Cacutud', 'Pulung Maragul', 'Pulungbulu',
      'Salapungan', 'San Jose', 'San Nicolas', 'Santa Teresita', 'Santa Trinidad',
      'Santo Cristo', 'Santo Domingo', 'Santo Rosario (Poblacion)', 'Sapalibutad',
      'Sapangbato', 'Tabun', 'Virgen delos Remedios', 'Ninoy Aquino (Marisol)'
    ];
    this.filteredBarangays = [...this.barangays];
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
    const { barangay, category } = this.reportForm.value;

    if (!this.startDate || !this.endDate) {
      toast.error('Selection Required', { description: 'Please select both start and end dates.' });
      return;
    }

    const start = new Date(this.startDate);
    const end = new Date(this.endDate);
    end.setHours(23, 59, 59, 999);

    const searchBarangay = (barangay || 'All').trim().toLowerCase();
    const searchCategory = (category || 'All').toLowerCase();

    this.reports = this.allReports.filter((r: HazardReport) => {
      const reportDate = new Date(r.createdAt || new Date());
      if (reportDate < start || reportDate > end) return false;
      if (searchBarangay !== 'all' && !r.barangay?.toLowerCase().includes(searchBarangay)) return false;
      if (searchCategory !== 'all' && r.category?.toLowerCase() !== searchCategory) return false;
      return true;
    });

    toast.success(`Found ${this.reports.length} reports`);
  }

  getResolvedBy(report: HazardReport): string {
    return report.statusHistory?.slice().reverse().find(s => s.adminName)?.adminName || 'N/A';
  }

  exportToCSV(): void {
    if (!this.reports.length) return;
    const csvContent = [
      ['Title', 'Category', 'Barangay', 'Status', 'Date', 'Lat', 'Lng', 'Resolved By'].join(','),
      ...this.reports.map(r => [
        `"${r.title || r.category}"`, r.category, r.barangay, r.status,
        new Date(r.createdAt!).toLocaleString(), r.location.coordinates[1],
        r.location.coordinates[0], this.getResolvedBy(r)
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Reports_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Export Complete');
  }
}