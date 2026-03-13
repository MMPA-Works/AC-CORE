import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LucideAngularModule, LUCIDE_ICONS, LucideIconProvider, Phone, Shield } from 'lucide-angular';

@Component({
  selector: 'app-citizen-footer',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  templateUrl: './citizen-footer.html',
  providers: [
    {
      provide: LUCIDE_ICONS,
      useValue: new LucideIconProvider({ Phone, Shield })
    }
  ]
})
export class CitizenFooterComponent {
  currentYear = new Date().getFullYear();

  readonly footerLinks = [
    { label: 'Dashboard', route: '/citizen/dashboard' },
    { label: 'Report Hazard', route: '/citizen/report' },
    { label: 'My Reports', route: '/citizen/my-reports' },
    { label: 'Emergency Directory', route: '/citizen/directory' },
  ];
}