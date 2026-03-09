import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { HlmScrollAreaImports } from '@spartan-ng/helm/scroll-area';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, HlmBadgeImports, HlmScrollAreaImports],
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
                  (click)="setActive(item.id)"
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
                  (click)="setActive(item.id)"
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

      <div class="p-4 shrink-0 bg-white border-t border-gray-200">
        <button 
          (click)="onLogout()" 
          class="w-full flex items-center px-4 py-3 rounded-xl text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors duration-200 border border-transparent hover:border-red-100"
        >
          <lucide-icon name="log-out" class="w-[18px] h-[18px] mr-3" strokeWidth="2"></lucide-icon>
          <span class="text-[13px] font-semibold tracking-wide">Sign Out</span>
        </button>
      </div>

    </aside>
  `
})
export class SidebarComponent {
  private router = inject(Router);
  readonly activeNav = signal<string>('hazards');

  readonly mainLinks = signal([
    { id: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard' },
    { id: 'hazards', label: 'Active Hazards', icon: 'map', badge: '12' },
    { id: 'dispatch', label: 'Dispatch Center', icon: 'radio' }
  ]);

  readonly managementLinks = signal([
    { id: 'analytics', label: 'Analytics', icon: 'bar-chart-3' },
    { id: 'citizens', label: 'Citizens', icon: 'users' },
    { id: 'settings', label: 'Settings', icon: 'settings' }
  ]);

  setActive(id: string) {
    this.activeNav.set(id);
  }

  onLogout() {
    localStorage.clear();
    sessionStorage.clear();
    this.router.navigate(['/admin/login']);
  }
}