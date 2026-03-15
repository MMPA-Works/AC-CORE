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
import { HAZARD_CATEGORIES } from '../../app.config';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { BrnSelectImports } from '@spartan-ng/brain/select';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { HlmTableImports } from '@spartan-ng/helm/table';
import { HlmPaginationImports } from '@spartan-ng/helm/pagination';
import { HlmScrollAreaImports } from '@spartan-ng/helm/scroll-area';
import { toast } from 'ngx-sonner';
import { buildMobilePagination, type MobilePaginationItem } from '../../shared/mobile-pagination';

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
export class HazardList implements OnInit, OnDestroy {
  reports = signal<HazardReport[]>([]);
  isLoading = signal<boolean>(false);
  totalReports = signal<number>(0);
  totalPages = signal<number>(1);
  barangays = signal<string[]>([]);
  categories = signal<string[]>([...HAZARD_CATEGORIES]);
  archiveView = signal<'active' | 'archived'>('active');
  searchDraft = signal<string>('');
  searchTerm = signal<string>('');

  filterBarangay = signal<string>('All');
  filterCategory = signal<string>('All');
  filterSeverity = signal<string>('All');
  filterStatus = signal<string>('All');

  sortColumn = signal<'severity' | 'status' | 'createdAt'>('createdAt');
  sortDirection = signal<'asc' | 'desc'>('desc');

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
    const prefix = this.isArchivedView() ? 'archived_hazard_reports' : 'hazard_reports';
    this.exportService.exportToCSV(this.reports(), `${prefix}_page_${this.currentPage()}.csv`);
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

    this.currentPage.set(1);
    this.requestReload();
  }

  onSearchDraftChange(value: string): void {
    this.searchDraft.set(value);
    this.searchInput$.next(value);
  }

  toggleSort(column: 'severity' | 'status' | 'createdAt'): void {
    if (this.sortColumn() === column) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set(column === 'createdAt' ? 'desc' : 'asc');
    }

    this.currentPage.set(1);
    this.requestReload();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages() && page !== this.currentPage()) {
      this.currentPage.set(page);
      this.requestReload();
    }
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.set(this.currentPage() + 1);
      this.requestReload();
    }
  }

  prevPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.set(this.currentPage() - 1);
      this.requestReload();
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

  getMobilePageArray(): MobilePaginationItem[] {
    return buildMobilePagination(this.currentPage(), this.totalPages(), 3);
  }
}
