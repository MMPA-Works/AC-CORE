import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar';
import { LucideAngularModule } from 'lucide-angular';
import { AdminFooter } from '../admin-footer/admin-footer';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent, LucideAngularModule, AdminFooter],
  templateUrl: './admin-layout.html'
})
export class AdminLayout {}