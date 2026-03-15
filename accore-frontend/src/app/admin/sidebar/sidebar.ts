import { Component, signal, inject, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { LucideAngularModule } from 'lucide-angular';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { HlmScrollAreaImports } from '@spartan-ng/helm/scroll-area';
import { AuthService } from '../../shared/auth';
import { jwtDecode } from 'jwt-decode';
import { HazardReportService } from '../../services/hazard-report';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    HlmBadgeImports,
    HlmScrollAreaImports,
    RouterModule
  ],
  template: `
    @if (isMobileOpen()) {
      <div 
        class="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden transition-opacity duration-300"
        (click)="closeMobile()"
      ></div>
    }

    <aside 
      class="absolute lg:static inset-y-0 left-0 z-50 flex flex-col bg-white border-r border-slate-200 transition-all duration-300 ease-in-out shadow-2xl lg:shadow-none h-full w-64 lg:w-auto"
      [ngClass]="{
        'translate-x-0': isMobileOpen(),
        '-translate-x-full lg:translate-x-0': !isMobileOpen()
      }"
    >
      <button 
        (click)="toggleCollapse()" 
        class="hidden lg:flex absolute -right-3.5 top-[26px] items-center justify-center w-7 h-7 bg-white border border-slate-200 text-slate-500 hover:text-slate-900 hover:border-slate-400 rounded-full shadow-sm transition-all z-50 hover:scale-110"
        aria-label="Toggle Desktop Sidebar"
      >
        <lucide-icon [name]="isCollapsed() ? 'chevron-right' : 'chevron-left'" class="w-4 h-4"></lucide-icon>
      </button>

      <div 
        class="h-16 lg:h-20 flex items-center shrink-0 border-b border-slate-100 transition-all"
        [ngClass]="(isCollapsed() && !isMobileOpen()) ? 'px-0 justify-center' : 'px-6 justify-between'"
      >
        <a routerLink="/admin/dashboard" class="flex items-center overflow-hidden min-w-0 flex-1"
           [ngClass]="{'justify-center': isCollapsed() && !isMobileOpen()}">
          <div class="w-8 h-8 lg:w-10 lg:h-10 flex items-center justify-center shrink-0">
            <img src="/logo/logo.svg" alt="AC-CORE Dashboard Official Logo" class="h-full w-full object-contain drop-shadow-sm" />
          </div>
          <div 
            class="flex flex-col transition-all duration-300 whitespace-nowrap overflow-hidden"
            [ngClass]="{'opacity-0 w-0 ml-0': isCollapsed() && !isMobileOpen(), 'opacity-100 w-auto ml-3': !isCollapsed() || isMobileOpen()}"
          >
            <span class="text-lg lg:text-xl font-black tracking-tight text-slate-800 leading-none">AC-CORE</span>
            <span class="text-[9px] lg:text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Command Center</span>
          </div>
        </a>
        
        <button class="lg:hidden p-2 text-slate-400 hover:text-slate-800 bg-slate-50 rounded-lg active:scale-95 transition-all" (click)="closeMobile()">
          <lucide-icon name="x" class="w-5 h-5"></lucide-icon>
        </button>
      </div>

      <ng-scrollbar hlm class="flex-1" appearance="compact">
        <nav class="px-4 py-6 space-y-1">
          <p 
            class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 px-2 transition-all duration-300 overflow-hidden whitespace-nowrap"
            [ngClass]="{'opacity-0 w-0 h-0 mb-0 text-center': isCollapsed() && !isMobileOpen(), 'opacity-100 w-auto': !isCollapsed() || isMobileOpen()}"
          >
            Main Menu
          </p>

          @for (item of mainLinks(); track item.id) {
            <button
              (click)="navigate(item.route, item.id)"
              class="w-full flex items-center py-3 mt-1 rounded-lg transition-all duration-200 group relative border border-transparent overflow-hidden"
              [ngClass]="[
                activeNav() === item.id ? 'bg-slate-100 text-slate-900 font-semibold shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900',
                (isCollapsed() && !isMobileOpen()) ? 'justify-center px-0' : 'px-3'
              ]"
              [title]="isCollapsed() && !isMobileOpen() ? item.label : ''"
            >
              <lucide-icon 
                [name]="item.icon" 
                class="w-5 h-5 shrink-0 transition-transform group-hover:scale-110" 
                [ngClass]="activeNav() === item.id ? 'text-slate-800' : 'text-slate-400 group-hover:text-slate-600'"
                [strokeWidth]="activeNav() === item.id ? 2.5 : 2"
              ></lucide-icon>
              
              <span 
                class="text-sm tracking-wide whitespace-nowrap transition-all duration-300 overflow-hidden text-left"
                [ngClass]="{'opacity-0 w-0 ml-0 flex-none': isCollapsed() && !isMobileOpen(), 'opacity-100 w-auto ml-3 flex-1': !isCollapsed() || isMobileOpen()}"
              >
                {{ item.label }}
              </span>

              @if (item.badge && (!isCollapsed() || isMobileOpen())) {
                <span class="ml-2 bg-white text-slate-600 border border-slate-200 text-xs font-bold px-2 h-6 flex items-center justify-center rounded-md shadow-sm transition-all">
                  {{ item.badge }}
                </span>
              }
            </button>
          }
        </nav>
      </ng-scrollbar>

      <div class="p-4 shrink-0 border-t border-slate-100 transition-all flex justify-center">
        <div 
          class="flex items-center w-full rounded-xl transition-colors overflow-hidden"
          [ngClass]="(isCollapsed() && !isMobileOpen()) ? 'justify-center p-0' : 'p-2 hover:bg-slate-50 border border-transparent hover:border-slate-100 justify-between'"
        >
          <div class="flex items-center overflow-hidden" [ngClass]="{'justify-center': isCollapsed() && !isMobileOpen(), 'flex-1': !isCollapsed() || isMobileOpen()}">
            <div class="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0 shadow-sm border border-slate-200 overflow-hidden">
              <img src="/assets/boss-tryke.png" alt="Current Administrator Profile Portrait" class="w-full h-full object-cover">
            </div>

            <div 
              class="flex flex-col transition-all duration-300 whitespace-nowrap overflow-hidden"
              [ngClass]="{'opacity-0 w-0 ml-0 flex-none': isCollapsed() && !isMobileOpen(), 'opacity-100 w-auto ml-3 flex-1': !isCollapsed() || isMobileOpen()}"
            >
              <span class="text-sm font-bold text-slate-800 truncate">
                {{ currentUser().firstName }} {{ currentUser().lastName }}
              </span>
              <span class="text-xs font-medium text-slate-500 truncate">
                {{ currentUser().role }}
              </span>
            </div>
          </div>
          
          <button 
            (click)="onLogout()" 
            class="p-2 ml-1 text-slate-400 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors shrink-0"
            [title]="(isCollapsed() && !isMobileOpen()) ? 'Sign Out' : 'Sign Out'"
            [ngClass]="{'hidden': isCollapsed() && !isMobileOpen()}"
          >
            <lucide-icon name="log-out" class="w-4 h-4"></lucide-icon>
          </button>
        </div>
      </div>
    </aside>
  `
})
export class SidebarComponent implements OnInit {

  private router = inject(Router);
  private authService = inject(AuthService);
  private hazardReportService = inject(HazardReportService);

  readonly activeNav = signal<string>('');
  readonly isCollapsed = signal<boolean>(false);
  readonly isMobileOpen = signal<boolean>(false);

  readonly currentUser = signal({
    firstName: 'System',
    lastName: 'Admin',
    role: 'Administrator',
    profileImage: 'assets/placeholder-avatar.png'
  });

  readonly mainLinks = signal([
    { id: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard', route: '/admin/dashboard' },
    { id: 'map', label: 'Live Map', icon: 'map', route: '/admin/map' },
    { id: 'hazards', label: 'Hazard Reports', icon: 'alert-triangle', route: '/admin/hazards', badge: '' },
    { id: 'historical-reports', label: 'Historical Reports', icon: 'history', route: '/admin/reports-generation' }
  ]);

  @HostListener('window:resize')
  onResize() {
    if (window.innerWidth >= 1024) {
      this.isMobileOpen.set(false);
    }
  }

  ngOnInit() {
    this.loadUserData();
    this.syncActiveNavWithUrl(this.router.url);
    this.loadPendingReportsCount();

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.syncActiveNavWithUrl(event.urlAfterRedirects || event.url);
      this.closeMobile();
    });
  }

  private loadPendingReportsCount() {
    this.hazardReportService.getReports().subscribe({
      next: (reports) => {
        const reportedCount = reports.filter(r => r.status === 'Reported').length;

        this.mainLinks.update(links =>
          links.map(link =>
            link.id === 'hazards'
              ? { ...link, badge: reportedCount > 0 ? reportedCount.toString() : '' }
              : link
          )
        );
      },
      error: (error) => {
        console.error('Failed to load reports count:', error);
      }
    });
  }

  private syncActiveNavWithUrl(url: string) {
    const matchedLink = this.mainLinks().find(link => url.includes(link.route));
    if (matchedLink) {
      this.activeNav.set(matchedLink.id);
    }
  }

  loadUserData() {
    const token = this.authService.getAdminToken();
    if (token) {
      try {
        const decoded: any = jwtDecode(token);

        this.currentUser.set({
          firstName: decoded.firstName || 'System',
          lastName: decoded.lastName || 'Admin',
          role: 'Administrator',
          profileImage: 'assets/placeholder-avatar.png'
        });

      } catch (error) {
        console.error('Token decode failed', error);
      }
    }
  }

  navigate(route: string, id: string) {
    this.activeNav.set(id);
    this.router.navigate([route]);
  }

  onLogout() {
    this.authService.logout();
    this.router.navigate(['/admin/login']);
  }

  toggleCollapse() {
    this.isCollapsed.update(v => !v);
  }

  toggleMobile() {
    this.isMobileOpen.update(v => !v);
  }

  closeMobile() {
    this.isMobileOpen.set(false);
  }
}