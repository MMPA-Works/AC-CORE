import { Directive } from '@angular/core';

@Directive({
  selector: '[hlmCardFooter],hlm-card-footer',
  host: {
    'data-slot': 'card-footer',
    class: 'flex items-center px-6 pb-6',
  },
})
export class HlmCardFooter {}
