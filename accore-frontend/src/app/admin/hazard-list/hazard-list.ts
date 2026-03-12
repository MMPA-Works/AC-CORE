import { ChangeDetectionStrategy, Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';

import { HazardReportService } from '../../services/hazard-report';
import { ExportService } from '../../services/export';
import { HazardReport } from '../../shared/models/hazard-report';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { BrnSelectImports } from '@spartan-ng/brain/select';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { HlmTableImports } from '@spartan-ng/helm/table';
import { HlmPaginationImports } from '@spartan-ng/helm/pagination';
import { HlmScrollAreaImports } from '@spartan-ng/helm/scroll-area';
import { toast } from 'ngx-sonner';

@Component({
  selector: 'app-hazard-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    HlmButtonImports,
    HlmBadgeImports,
    BrnSelectImports,
    HlmSelectImports,
    HlmTableImports,
    HlmPaginationImports,
    HlmScrollAreaImports
  ],
  providers: [HazardReportService],
  templateUrl: './hazard-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HazardList implements OnInit {
  reports = signal<HazardReport[]>([]);
  isLoading = signal<boolean>(false);
  totalReports = signal<number>(0);
  totalPages = signal<number>(1);
  barangays = signal<string[]>([]);
  categories = signal<string[]>([]);

  filterBarangay = signal<string>('All');
  filterCategory = signal<string>('All');
  filterSeverity = signal<string>('All');
  filterStatus = signal<string>('All');

  sortColumn = signal<'severity' | 'status' | 'createdAt'>('createdAt');
  sortDirection = signal<'asc' | 'desc'>('desc');

  currentPage = signal<number>(1);
  itemsPerPage = signal<number>(10);

  availableBarangays = computed(() => ['All', ...this.barangays()]);
  availableCategories = computed(() => ['All', ...this.categories()]);

  rangeStart = computed(() => {
    if (this.totalReports() === 0) {
      return 0;
    }

    return ((this.currentPage() - 1) * this.itemsPerPage()) + 1;
  });

  rangeEnd = computed(() => {
    if (this.totalReports() === 0) {
      return 0;
    }

    return Math.min(this.currentPage() * this.itemsPerPage(), this.totalReports());
  });

  constructor(
    private hazardService: HazardReportService,
    private exportService: ExportService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadReportsPage();
  }

  loadReportsPage(): void {
    this.isLoading.set(true);

    this.hazardService.getReportsPage({
      page: this.currentPage(),
      limit: this.itemsPerPage(),
      barangay: this.filterBarangay(),
      category: this.filterCategory(),
      severity: this.filterSeverity(),
      status: this.filterStatus(),
      sortColumn: this.sortColumn(),
      sortDirection: this.sortDirection(),
    }).subscribe({
      next: (response) => {
        this.reports.set(response.reports || []);
        this.totalReports.set(response.pagination?.total || 0);
        this.totalPages.set(response.pagination?.totalPages || 1);
        this.barangays.set(response.filters?.barangays || []);
        this.categories.set(response.filters?.categories || []);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error fetching reports:', err);
        toast.error('Failed to load reports');
        this.reports.set([]);
        this.totalReports.set(0);
        this.totalPages.set(1);
        this.barangays.set([]);
        this.categories.set([]);
        this.isLoading.set(false);
      }
    });
  }

  viewDetails(id: string): void {
    this.router.navigate(['/admin/hazards', id]);
  }

  exportToCSV(): void {
    this.exportService.exportToCSV(this.reports(), `hazard_reports_page_${this.currentPage()}.csv`);
  }

  onFilterChange(type: 'barangay' | 'category' | 'severity' | 'status', value: string): void {
    if (type === 'barangay') this.filterBarangay.set(value);
    if (type === 'category') this.filterCategory.set(value);
    if (type === 'severity') this.filterSeverity.set(value);
    if (type === 'status') this.filterStatus.set(value);

    this.currentPage.set(1);
    this.loadReportsPage();
  }

  toggleSort(column: 'severity' | 'status' | 'createdAt'): void {
    if (this.sortColumn() === column) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set(column === 'createdAt' ? 'desc' : 'asc');
    }

    this.currentPage.set(1);
    this.loadReportsPage();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages() && page !== this.currentPage()) {
      this.currentPage.set(page);
      this.loadReportsPage();
    }
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.set(this.currentPage() + 1);
      this.loadReportsPage();
    }
  }

  prevPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.set(this.currentPage() - 1);
      this.loadReportsPage();
    }
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
}
