import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormsModule } from '@angular/forms';
import { HazardReportService } from '../../services/hazard-report';
import { HazardReport } from '../../shared/models/hazard-report';
import { toast } from 'ngx-sonner';

// Spartan Imports
import { BrnSelectImports } from '@spartan-ng/brain/select';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmTableImports } from '@spartan-ng/helm/table';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { HlmDatePicker } from '@spartan-ng/helm/date-picker';
import { HlmLabel } from '@spartan-ng/helm/label';
import { HlmPaginationImports } from '@spartan-ng/helm/pagination';
import { buildMobilePagination, type MobilePaginationItem } from '../../shared/mobile-pagination';

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
    HlmDatePicker,
    HlmLabel,
    HlmPaginationImports
  ],
  templateUrl: './reports-generation.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReportsGeneration implements OnInit {
  private hazardReportService = inject(HazardReportService);
  private fb = inject(FormBuilder);

  isLoading = false;
  allReports: HazardReport[] = [];
  
  // Signals for Table Data, Search & Pagination
  reports = signal<HazardReport[]>([]);
  searchQuery = signal<string>('');
  currentPage = signal<number>(1);
  itemsPerPage = signal<number>(5);

  // Computed signal that filters generated reports based on the search bar
  displayReports = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return this.reports();

    return this.reports().filter(r => {
      const title = (r.title || '').toLowerCase();
      const category = (r.category || '').toLowerCase();
      const barangay = (r.barangay || '').toLowerCase();
      const status = (r.status || '').toLowerCase();

      return title.includes(query) || category.includes(query) || barangay.includes(query) || status.includes(query);
    });
  });

  paginatedReports = computed(() => {
    const start = (this.currentPage() - 1) * this.itemsPerPage();
    return this.displayReports().slice(start, start + this.itemsPerPage());
  });

  totalPages = computed(() => Math.ceil(this.displayReports().length / this.itemsPerPage()) || 1);

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

    const filtered = this.allReports.filter((r: HazardReport) => {
      const reportDate = new Date(r.createdAt || new Date());
      if (reportDate < start || reportDate > end) return false;
      if (searchBarangay !== 'all' && !r.barangay?.toLowerCase().includes(searchBarangay)) return false;
      if (searchCategory !== 'all' && r.category?.toLowerCase() !== searchCategory) return false;
      return true;
    });

    this.reports.set(filtered);
    this.searchQuery.set(''); // Reset search query when new reports are generated
    this.currentPage.set(1);
    toast.success(`Generated ${filtered.length} reports`);
  }

  onSearch(query: string) {
    this.searchQuery.set(query);
    this.currentPage.set(1);
  }

  // Pagination Controls
  nextPage(): void {
    if (this.currentPage() < this.totalPages()) this.currentPage.set(this.currentPage() + 1);
  }

  prevPage(): void {
    if (this.currentPage() > 1) this.currentPage.set(this.currentPage() - 1);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) this.currentPage.set(page);
  }

  getPageArray(): number[] {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];
    
    let start = Math.max(1, current - 2);
    let end = Math.min(total, current + 2);
    
    if (current <= 2) end = Math.min(total, 5);
    if (current >= total - 1) start = Math.max(1, total - 4);
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  getMobilePageArray(): MobilePaginationItem[] {
    return buildMobilePagination(this.currentPage(), this.totalPages(), 3);
  }

  min(a: number, b: number): number {
    return Math.min(a, b);
  }

  getResolvedBy(report: HazardReport): string {
    return report.statusHistory?.slice().reverse().find(s => s.adminName)?.adminName || 'N/A';
  }

  exportToCSV(): void {
    // We export the actively displayed/searched reports
    const currentReports = this.displayReports();
    if (!currentReports.length) return;
    
    const csvContent = [
      ['Title', 'Category', 'Barangay', 'Status', 'Date', 'Lat', 'Lng', 'Resolved By'].join(','),
      ...currentReports.map(r => [
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
