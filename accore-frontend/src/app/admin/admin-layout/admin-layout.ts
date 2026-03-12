import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent],
  template: `
    <div class="h-screen w-full flex overflow-hidden bg-gray-100 font-sans">
      
      <app-sidebar></app-sidebar>

      <main class="flex-1 relative z-0 overflow-hidden">
        <router-outlet></router-outlet>
      </main>

    </div>
  `
})
export class AdminLayout {}