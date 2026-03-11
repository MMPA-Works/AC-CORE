import { Directive } from '@angular/core';

@Directive({
  selector: '[hlmCardAction],hlm-card-action',
  host: {
    'data-slot': 'card-action',
    class: 'col-start-2 row-span-2 row-start-1 self-start justify-self-end',
  },
})
export class HlmCardAction {}
