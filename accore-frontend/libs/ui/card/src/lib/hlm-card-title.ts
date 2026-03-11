import { Directive } from '@angular/core';

@Directive({
  selector: '[hlmCardTitle],hlm-card-title',
  host: {
    'data-slot': 'card-title',
    class: 'leading-none font-semibold',
  },
})
export class HlmCardTitle {}
