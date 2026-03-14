import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';
import {
  EMPTY,
  Subject,
  catchError,
  debounceTime,
  distinctUntilChanged,
  map,
  merge,
  switchMap,
  takeUntil,
  tap,
} from 'rxjs';

import { HazardReportService } from '../../services/hazard-report';
import { ExportService } from '../../services/export';
import {
  HazardReport,
  HazardReportPageQuery,
  PaginatedHazardReportResponse,
} from '../../shared/models/hazard-report';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { BrnSelectImports } from '@spartan-ng/brain/select';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { HlmTableImports } from '@spartan-ng/helm/table';
import { HlmPaginationImports } from '@spartan-ng/helm/pagination';
import { toast } from 'ngx-sonner';

// Custom sorting weights to ensure logical ordering rather than alphabetical
const SEVERITY_WEIGHT: Record<string, number> = { 'Low': 1, 'Medium': 2, 'Critical': 3 };
const STATUS_WEIGHT: Record<string, number> = { 'Reported': 1, 'Under Review': 2, 'In Progress': 3, 'Resolved': 4 };

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
    HlmScrollAreaImports,
  ],
  providers: [HazardReportService],
  templateUrl: './hazard-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HazardList implements OnInit {
  reports = signal<any[]>([]);

  // Filtering State
  filterBarangay = signal<string>('All');
  filterCategory = signal<string>('All');
  filterSeverity = signal<string>('All');
  filterStatus = signal<string>('All');

  // Sorting State - Added 'createdAt'
  sortColumn = signal<'severity' | 'status' | 'createdAt' | null>('createdAt');
  sortDirection = signal<'asc' | 'desc'>('desc'); // Default to newest first

  // Pagination State
  currentPage = signal<number>(1);
  itemsPerPage = signal<number>(10);

  riskSources = signal<Set<string>>(new Set());
  riskTargets = signal<Set<string>>(new Set());

  private readonly destroy$ = new Subject<void>();
  private readonly reload$ = new Subject<void>();
  private readonly searchInput$ = new Subject<string>();

  availableBarangays = computed(() => ['All', ...this.barangays()]);
  availableCategories = computed(() => ['All', ...this.categories()]);
  isArchivedView = computed(() => this.archiveView() === 'archived');

  rangeStart = computed(() => {
    if (this.totalReports() === 0) {
      return 0;
    }
    return (this.currentPage() - 1) * this.itemsPerPage() + 1;
  });

  rangeEnd = computed(() => {
    if (this.totalReports() === 0) {
      return 0;
    }
    return Math.min(this.currentPage() * this.itemsPerPage(), this.totalReports());
  });

  // 1. First apply filters
  filteredReports = computed(() => {
    const brgy = this.filterBarangay();
    const cat = this.filterCategory();
    const sev = this.filterSeverity();
    const stat = this.filterStatus();

    return this.reports().filter(report => {
      const matchBrgy = brgy === 'All' || report.barangay === brgy;
      const matchCat = cat === 'All' || report.category === cat;
      const matchSev = sev === 'All' || report.severity === sev;
      const matchStat = stat === 'All' || report.status === stat;
      return matchBrgy && matchCat && matchSev && matchStat;
    });
  });

  // 2. Then apply sorting
  sortedReports = computed(() => {
    const baseReports = [...this.filteredReports()];
    const col = this.sortColumn();
    const dir = this.sortDirection();

    if (!col) return baseReports;

    return baseReports.sort((a, b) => {
      if (col === 'createdAt') {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        if (dateA < dateB) return dir === 'asc' ? -1 : 1;
        if (dateA > dateB) return dir === 'asc' ? 1 : -1;
        return 0;
      }

      let valA = a[col];
      let valB = b[col];

      if (col === 'severity') {
        valA = SEVERITY_WEIGHT[valA] || 0;
        valB = SEVERITY_WEIGHT[valB] || 0;
      } else if (col === 'status') {
        valA = STATUS_WEIGHT[valA] || 0;
        valB = STATUS_WEIGHT[valB] || 0;
      }

      if (valA < valB) return dir === 'asc' ? -1 : 1;
      if (valA > valB) return dir === 'asc' ? 1 : -1;
      return 0;
    });
  });

  // 3. Finally apply pagination
  paginatedReports = computed(() => {
    const start = (this.currentPage() - 1) * this.itemsPerPage();
    return this.sortedReports().slice(start, start + this.itemsPerPage());
  });

  totalPages = computed(() => Math.ceil(this.sortedReports().length / this.itemsPerPage()) || 1);

  constructor(
    private hazardService: HazardReportService,
    private exportService: ExportService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    const searchReload$ = this.searchInput$.pipe(
      map((value) => value.trim()),
      debounceTime(350),
      distinctUntilChanged(),
      tap((search) => {
        this.searchTerm.set(search);
        this.currentPage.set(1);
      }),
      map(() => void 0),
    );

    merge(this.reload$, searchReload$)
      .pipe(
        tap(() => this.isLoading.set(true)),
        switchMap(() =>
          this.hazardService.getReportsPage(this.buildPageQuery()).pipe(
            catchError((err) => {
              this.handleLoadError(err);
              return EMPTY;
            }),
          ),
        ),
        takeUntil(this.destroy$),
      )
      .subscribe((response) => {
        this.applyResponse(response);
      });

    this.loadDownstreamRisks();
    this.reload$.next();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.reload$.complete();
    this.searchInput$.complete();
  }

  private loadDownstreamRisks(): void {
    this.hazardService
      .getDownstreamRisks()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (risks) => {
          const sources = new Set<string>();
          const targets = new Set<string>();

          Object.entries(risks).forEach(([sourceId, group]) => {
            sources.add(sourceId);
            group.forEach((report) => {
              if (report._id !== sourceId) {
                targets.add(report._id);
              }
            });
          });

          this.riskSources.set(sources);
          this.riskTargets.set(targets);
        },
        error: (err) => console.error('Failed to load downstream risks:', err),
      });
  }

  private buildPageQuery(): HazardReportPageQuery {
    return {
      page: this.currentPage(),
      limit: this.itemsPerPage(),
      archived: this.isArchivedView() ? 'true' : 'false',
      search: this.searchTerm(),
      barangay: this.filterBarangay(),
      category: this.filterCategory(),
      severity: this.filterSeverity(),
      status: this.filterStatus(),
      sortColumn: this.sortColumn(),
      sortDirection: this.sortDirection(),
    };
  }

  private applyResponse(response: PaginatedHazardReportResponse): void {
    this.reports.set(response.reports || []);
    this.totalReports.set(response.pagination?.total || 0);
    this.totalPages.set(response.pagination?.totalPages || 1);
    this.barangays.set(response.filters?.barangays || []);
    this.categories.set(response.filters?.categories || []);
    this.isLoading.set(false);
  }

  private handleLoadError(err: unknown): void {
    console.error('Error fetching reports:', err);
    toast.error('Failed to load reports');
    this.reports.set([]);
    this.totalReports.set(0);
    this.totalPages.set(1);
    this.barangays.set([]);
    this.categories.set([]);
    this.isLoading.set(false);
  }

  private requestReload(): void {
    this.reload$.next();
  }

  viewDetails(id: string): void {
    this.router.navigate(['/admin/hazards', id]);
  }

  exportToCSV(): void {
    this.exportService.exportToCSV(this.sortedReports(), 'hazard_reports.csv');
  }

  isGuestReport(report: HazardReport): boolean {
    return !report.citizenId;
  }

  setArchiveView(view: 'active' | 'archived'): void {
    if (this.archiveView() === view) {
      return;
    }

    this.archiveView.set(view);
    this.currentPage.set(1);
    this.searchDraft.set('');
    this.searchTerm.set('');
    this.filterBarangay.set('All');
    this.filterCategory.set('All');
    this.filterSeverity.set('All');
    this.filterStatus.set('All');
    this.requestReload();
  }

  onFilterChange(type: 'barangay' | 'category' | 'severity' | 'status', value: string): void {
    if (type === 'barangay') this.filterBarangay.set(value);
    if (type === 'category') this.filterCategory.set(value);
    if (type === 'severity') this.filterSeverity.set(value);
    if (type === 'status') this.filterStatus.set(value);
    
    // Reset pagination to page 1 whenever filters change
    this.currentPage.set(1);
  }

  toggleSort(column: 'severity' | 'status' | 'createdAt'): void {
    if (this.sortColumn() === column) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(column);
      // Default to descending (newest first) for dates, ascending for text/status
      this.sortDirection.set(column === 'createdAt' ? 'desc' : 'asc');
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.set(this.currentPage() + 1);
    }
  }

  prevPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.set(this.currentPage() - 1);
    }
  }

  getPageArray(): number[] {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];
    
    // Simple logic to show a maximum of 5 page numbers
    let start = Math.max(1, current - 2);
    let end = Math.min(total, current + 2);
    
    if (current <= 2) end = Math.min(total, 5);
    if (current >= total - 1) start = Math.max(1, total - 4);
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  min(a: number, b: number): number {
    return Math.min(a, b);
  }
}