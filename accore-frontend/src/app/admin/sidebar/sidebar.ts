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
        class="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden transition-opacity"
        (click)="closeMobile()"
      ></div>
    }

    <aside 
      class="fixed inset-y-0 left-0 z-50 flex flex-col bg-white border-r border-gray-200 transition-all duration-300 ease-in-out shadow-lg lg:shadow-none lg:static lg:h-screen lg:shrink-0"
      [ngClass]="{
        'w-64': !isCollapsed(),
        'w-20': isCollapsed(),
        'translate-x-0': isMobileOpen(),
        '-translate-x-full lg:translate-x-0': !isMobileOpen()
      }"
    >
      <div class="h-20 flex items-center justify-between px-5 shrink-0 border-b border-gray-100 transition-all">
        <div class="flex items-center overflow-hidden">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shrink-0 shadow-sm">
            <lucide-icon name="shield-alert" class="text-white w-5 h-5"></lucide-icon>
          </div>
          <div 
            class="flex flex-col ml-3 transition-opacity duration-300 whitespace-nowrap"
            [ngClass]="{'opacity-0 hidden': isCollapsed(), 'opacity-100': !isCollapsed()}"
          >
            <span class="text-lg font-extrabold tracking-tight text-gray-900 leading-none">AC-CORE</span>
            <span class="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1">Command Center</span>
          </div>
        </div>
        
        <button class="lg:hidden p-2 text-gray-400 hover:text-gray-900" (click)="closeMobile()">
          <lucide-icon name="x" class="w-5 h-5"></lucide-icon>
        </button>
      </div>

      <ng-scrollbar hlm class="flex-1" appearance="compact">
        <nav class="px-3 py-6 space-y-6">
          <div class="space-y-1.5">
            @for (item of mainLinks(); track item.id) {
              <button
                (click)="navigate(item.route, item.id)"
                class="w-full flex items-center px-3 py-3 rounded-xl transition-all duration-200 group relative"
                [ngClass]="activeNav() === item.id 
                  ? 'bg-primary/10 text-primary font-semibold' 
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'"
                [title]="isCollapsed() ? item.label : ''"
              >
                <lucide-icon 
                  [name]="item.icon" 
                  class="w-5 h-5 shrink-0 transition-transform group-hover:scale-110" 
                  [ngClass]="activeNav() === item.id ? 'text-primary' : 'text-gray-400 group-hover:text-gray-600'"
                  [strokeWidth]="activeNav() === item.id ? 2.5 : 2"
                ></lucide-icon>
                
                <span 
                  class="ml-3 text-sm tracking-wide whitespace-nowrap transition-all duration-300"
                  [ngClass]="{'opacity-0 w-0 hidden': isCollapsed(), 'opacity-100 w-auto': !isCollapsed()}"
                >
                  {{ item.label }}
                </span>

                @if (item.badge && !isCollapsed()) {
                  <span class="ml-auto bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                    {{ item.badge }}
                  </span>
                }
                @if (item.badge && isCollapsed()) {
                  <span class="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full animate-pulse"></span>
                }
              </button>
            }
          </div>
        </nav>
      </ng-scrollbar>

      <div class="p-4 shrink-0 border-t border-gray-100 flex flex-col gap-2">
        <button 
          (click)="toggleCollapse()" 
          class="hidden lg:flex items-center justify-center w-full py-2 mb-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <lucide-icon [name]="isCollapsed() ? 'chevron-right' : 'chevron-left'" class="w-5 h-5"></lucide-icon>
        </button>

        <div class="flex items-center justify-between w-full p-2 rounded-xl bg-gray-50 border border-gray-100">
          <div class="flex items-center overflow-hidden">
            <div class="w-9 h-9 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm overflow-hidden">
              <img [src]="currentUser().profileImage" alt="Administrator Profile Picture" class="w-full h-full object-cover">
            </div>

            <div 
              class="ml-3 flex flex-col transition-opacity duration-300 whitespace-nowrap"
              [ngClass]="{'opacity-0 hidden': isCollapsed(), 'opacity-100': !isCollapsed()}"
            >
              <!-- FULL NAME -->
              <span class="text-sm font-bold text-gray-900 truncate">
                {{ currentUser().firstName }} {{ currentUser().lastName }}
              </span>

              <span class="text-[10px] font-bold text-gray-500 uppercase tracking-wider truncate">
                {{ currentUser().role }}
              </span>
            </div>
          </div>
          
          <button 
            (click)="onLogout()" 
            class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            [title]="isCollapsed() ? 'Sign Out' : ''"
            [ngClass]="{'hidden': isCollapsed()}"
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
    const token = this.authService.getToken();
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