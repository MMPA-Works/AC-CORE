import { CommonModule } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { HazardReportStatus } from '../../../shared/models/hazard-report';

@Component({
  selector: 'app-pizza-tracker',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './pizza-tracker.html',
})
export class PizzaTrackerComponent {
  readonly status = input<HazardReportStatus>('Reported');

  readonly steps = ['Reported', 'Under Review', 'In Progress', 'Resolved'] as const;
  readonly statusLabel = computed(() => {
    switch (this.status()) {
      case 'Dispatched':
        return 'In Progress';
      default:
        return this.status();
    }
  });

  readonly currentStep = computed(() => {
    switch (this.status()) {
      case 'Reported':
        return 0;
      case 'Under Review':
        return 1;
      case 'Dispatched':
      case 'In Progress':
        return 2;
      case 'Resolved':
        return 3;
      default:
        return 0;
    }
  });

  readonly progressWidth = computed(() => `${(this.currentStep() / (this.steps.length - 1)) * 100}%`);

  isComplete(index: number): boolean {
    return index < this.currentStep();
  }

  isCurrent(index: number): boolean {
    return index === this.currentStep();
  }

  getStepCaption(index: number): string {
    switch (index) {
      case 0:
        return 'Received';
      case 1:
        return 'Queued';
      case 2:
        return 'Work Ongoing';
      case 3:
        return 'Closed';
      default:
        return '';
    }
  }

  showCompletedIcon(index: number): boolean {
    return index <= this.currentStep();
  }
}
