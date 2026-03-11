import { Directive } from '@angular/core';

@Directive({
  selector: '[hlmCardContent],hlm-card-content',
  host: {
    'data-slot': 'card-content',
    class: 'px-6',
  },
})
export class HlmCardContent {}
