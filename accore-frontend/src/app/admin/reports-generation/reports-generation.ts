import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { HazardReportService } from '../../services/hazard-report';
import { ExportService } from '../../services/export';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

@Component({
  selector: 'app-reports-generation',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './reports-generation.html',
  styleUrls: ['./reports-generation.css']
})
export class ReportsGeneration implements OnInit {
  private hazardReportService = inject(HazardReportService);
  private exportService = inject(ExportService);
  private fb = inject(FormBuilder);

  isLoading = false;
  allReports: any[] = []; // Raw data from database
  reports: any[] = [];    // Filtered data displayed in UI

  categories: string[] = ['All', 'Pothole', 'Clogged Drain', 'Fallen Tree', 'Streetlight Out', 'Flooding'];
  barangays: string[] = [
    'Pob. Angeles', 'Balibago', 'Cutcut', 'Lourdes', 'Santo Rosario', 
    'Santo Domingo', 'San Jose', 'Pulungbulu', 'Amsic', 'Santa Trinidad', 'Lourdes North West'
  ];
  
  filteredBarangays$!: Observable<string[]>;

  reportForm = this.fb.group({
    startDate: [null as string | null],
    endDate: [null as string | null],
    barangay: ['All'],
    category: ['All']
  });

  ngOnInit() {
    this.loadReports();

    this.filteredBarangays$ = this.reportForm.get('barangay')!.valueChanges.pipe(
      startWith('All'),
      map(value => this._filterBarangays(value || ''))
    );
  }

  private _filterBarangays(value: string): string[] {
    const filterValue = value.toLowerCase();
    if (filterValue === 'all' || filterValue === '') return this.barangays;
    return this.barangays.filter(option => option.toLowerCase().includes(filterValue));
  }

  loadReports() {
    this.isLoading = true;
    this.hazardReportService.getReports().subscribe({
      next: (data: any) => {
        // Ensure data is handled correctly whether it's a direct array or wrapped in an object
        this.allReports = Array.isArray(data) ? data : (data.reports || []);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load reports:', err);
        this.isLoading = false;
      }
    });
  }

  onFilterReports() {
    const { startDate, endDate, barangay, category } = this.reportForm.value;

    if (!startDate || !endDate) {
      alert('Please select both start and end date.');
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    // Set end date to the very end of the day
    end.setHours(23, 59, 59, 999);

    const searchBarangay = (barangay || 'All').trim().toLowerCase();
    const searchCategory = (category || 'All').toLowerCase();

    // Filter the allReports array and assign it to the display array 'reports'
    this.reports = this.allReports.filter((r: any) => {
      const reportDate = new Date(r.createdAt);

      // 1. Date filter
      if (reportDate < start || reportDate > end) return false;

      // 2. Barangay filter
      if (searchBarangay !== 'all' && searchBarangay !== '') {
        const rBarangay = (r.barangay || '').toLowerCase();
        if (!rBarangay.includes(searchBarangay)) return false;
      }

      // 3. Category filter
      if (searchCategory !== 'all') {
        const rCategory = (r.category || '').toLowerCase();
        if (rCategory !== searchCategory) return false;
      }

      return true;
    });
  }

  /**
   * Helper to extract the name of the admin who resolved the hazard
   */
  getResolvedBy(report: any): string {
    if (report.statusHistory && report.statusHistory.length > 0) {
      // Look for the last entry that has an adminName (likely the one who resolved it)
      const resolvedStep = [...report.statusHistory].reverse().find((s: any) => s.adminName);
      if (resolvedStep) return resolvedStep.adminName;
    }
    return report.resolvedBy || 'N/A';
  }

  /**
   * Prepares the filtered results for the ExportService
   */
  exportToCSV(): void {
    if (!this.reports || this.reports.length === 0) {
      alert('No reports found to export. Please apply filters first.');
      return;
    }

    // Map the reports into a flat structure that the CSV service can easily parse
    const csvData = this.reports.map(r => {
      const coords = r.location?.coordinates || [];
      return {
        'Title': (r.title || r.category || 'N/A').replace(/,/g, ' '),
        'Category': r.category || 'N/A',
        'Barangay': r.barangay || 'N/A',
        'Status': r.status || 'Reported',
        'Created At': r.createdAt ? new Date(r.createdAt).toLocaleString() : 'N/A',
        'Latitude': coords[1] ?? 'N/A',
        'Longitude': coords[0] ?? 'N/A',
        'Resolved By': this.getResolvedBy(r)
      };
    });

    // Trigger the service download
    this.exportService.exportToCSV(csvData, `Hazard_Reports_Export_${new Date().toISOString().split('T')[0]}`);
  }
}