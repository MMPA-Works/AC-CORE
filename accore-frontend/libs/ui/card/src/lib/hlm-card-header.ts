import { Directive } from '@angular/core';

@Directive({
  selector: '[hlmCardHeader],hlm-card-header',
  host: {
    'data-slot': 'card-header',
    class: 'grid auto-rows-min grid-cols-[1fr_auto] items-start gap-1.5 px-6 pt-6',
  },
})
export class HlmCardHeader {}
