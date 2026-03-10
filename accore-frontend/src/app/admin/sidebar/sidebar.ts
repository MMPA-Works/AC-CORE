import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { LucideAngularModule } from 'lucide-angular';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { HlmScrollAreaImports } from '@spartan-ng/helm/scroll-area';
import { AuthService } from '../../shared/auth';
import { jwtDecode } from 'jwt-decode';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, HlmBadgeImports, HlmScrollAreaImports, RouterModule],
  template: `
    <aside class="w-[260px] h-screen bg-gray-50 border-r border-gray-200 flex flex-col shrink-0">
      
      <div class="h-20 flex items-center px-6 shrink-0 border-b border-gray-200 bg-white">
        <div class="w-8 h-8 rounded-lg bg-primary flex items-center justify-center mr-3 shadow-sm">
          <lucide-icon name="shield-alert" class="text-white w-4 h-4"></lucide-icon>
        </div>
        <div class="flex flex-col">
          <span class="text-[16px] font-bold tracking-wide text-gray-900 leading-tight">AC-CORE</span>
          <span class="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Command Center</span>
        </div>
      </div>

      <ng-scrollbar hlm class="flex-1 bg-gray-50" appearance="compact">
        <nav class="px-4 py-6 space-y-8">
          
          <div>
            <h4 class="px-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Overview</h4>
            <div class="space-y-1">
              @for (item of mainLinks(); track item.id) {
                <button
                  (click)="navigate(item.route, item.id)"
                  class="w-full flex items-center px-3 py-2.5 rounded-xl transition-all duration-200 group"
                  [ngClass]="activeNav() === item.id 
                    ? 'bg-white text-primary shadow-sm border border-gray-200' 
                    : 'text-gray-500 hover:bg-gray-200/50 hover:text-gray-900 border border-transparent'"
                >
                  <lucide-icon [name]="item.icon" class="w-[18px] h-[18px] mr-3" [strokeWidth]="activeNav() === item.id ? 2.5 : 2"></lucide-icon>
                  <span class="text-[13px] font-medium tracking-wide">{{ item.label }}</span>
                  
                  @if (item.badge) {
                    <span class="ml-auto bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm">
                      {{ item.badge }}
                    </span>
                  }
                </button>
              }
            </div>
          </div>

          <div>
            <h4 class="px-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Manage</h4>
            <div class="space-y-1">
              @for (item of managementLinks(); track item.id) {
                <button
                  (click)="navigate(item.route, item.id)"
                  class="w-full flex items-center px-3 py-2.5 rounded-xl transition-all duration-200 group text-gray-500 hover:bg-gray-200/50 hover:text-gray-900 border border-transparent"
                  [ngClass]="activeNav() === item.id ? 'bg-white text-primary shadow-sm border-gray-200' : ''"
                >
                  <lucide-icon [name]="item.icon" class="w-[18px] h-[18px] mr-3" strokeWidth="2"></lucide-icon>
                  <span class="text-[13px] font-medium tracking-wide">{{ item.label }}</span>
                </button>
              }
            </div>
          </div>

        </nav>
      </ng-scrollbar>

      <div class="p-3 shrink-0 bg-white border-t border-gray-200">
        <div class="flex items-center w-full p-2 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100 group">
          
          <div class="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center shrink-0 border border-gray-200 overflow-hidden">
            <img [src]="currentUser().profileImage" alt="Administrator profile picture" class="w-full h-full object-cover">
          </div>

          <div class="ml-3 flex flex-col overflow-hidden">
            <span class="text-[13px] font-bold text-gray-900 truncate">{{ currentUser().firstName }} {{ currentUser().lastName }}</span>
            <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate mt-0.5">{{ currentUser().role }}</span>
          </div>

          <button 
            (click)="onLogout()" 
            class="ml-auto p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 active:scale-95"
            title="Sign Out"
          >
            <lucide-icon name="log-out" class="w-[18px] h-[18px]"></lucide-icon>
          </button>
          
        </div>
      </div>

    </aside>
  `
})
export class SidebarComponent implements OnInit {
  private router = inject(Router);
  private authService = inject(AuthService);

  // We start it blank. It will instantly update in ngOnInit based on the URL.
  readonly activeNav = signal<string>('');

  readonly currentUser = signal({
    firstName: 'System',
    lastName: 'Admin',
    role: 'Administrator',
    profileImage: 'assets/placeholder-avatar.png'
  });

  readonly mainLinks = signal([
    { id: 'dashboard', label: 'Dashboard', icon: 'bar-chart-3', route: '/admin/dashboard' },
    { id: 'map', label: 'Live Map', icon: 'map', route: '/admin/map' },
    { id: 'hazards', label: 'Hazard Reports', icon: 'layout-dashboard', route: '/admin/hazards', badge: '12' }
  ]);

  readonly managementLinks = signal([
    { id: 'citizens', label: 'Citizens', icon: 'users', route: '/admin/citizens' },
    { id: 'settings', label: 'Settings', icon: 'settings', route: '/admin/settings' }
  ]);

  ngOnInit() {
    this.loadUserData();
    this.syncActiveNavWithUrl(this.router.url); // Run once immediately on load

    // Listen to routing changes (like clicking Back/Forward in the browser)
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.syncActiveNavWithUrl(event.urlAfterRedirects || event.url);
    });
  }

  // Checks the current URL against our link lists and highlights the correct button
  private syncActiveNavWithUrl(url: string) {
    const allLinks = [...this.mainLinks(), ...this.managementLinks()];
    const matchedLink = allLinks.find(link => url.includes(link.route));
    
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
}