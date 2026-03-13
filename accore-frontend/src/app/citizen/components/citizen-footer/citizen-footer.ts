import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LucideAngularModule, LUCIDE_ICONS, LucideIconProvider, Phone, Shield } from 'lucide-angular';

@Component({
  selector: 'app-citizen-footer',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  templateUrl: './citizen-footer.html',
  // OPTIMIZATION: OnPush strategy reduces CPU usage significantly during scroll and map interaction
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: LUCIDE_ICONS,
      useValue: new LucideIconProvider({ Phone, Shield })
    }
  ]
})
export class CitizenFooterComponent {
  readonly currentYear = new Date().getFullYear();

  readonly platformLinks = [
    { label: 'Dashboard', route: '/citizen/dashboard' },
    { label: 'Report Hazard', route: '/citizen/report' },
    { label: 'My Reports', route: '/citizen/my-reports' },
    { label: 'Emergency Directory', route: '/citizen/directory' },
  ] as const;

  readonly legalLinks = [
    { label: 'Privacy Policy', route: '/citizen/privacy' },
    { label: 'Terms of Service', route: '/citizen/terms' },
    { label: 'Cookie Policy', route: '/citizen/cookies' },
  ] as const;
}