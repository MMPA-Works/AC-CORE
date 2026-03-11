import { Directive } from '@angular/core';

@Directive({
  selector: '[hlmCardDescription],hlm-card-description',
  host: {
    'data-slot': 'card-description',
    class: 'text-muted-foreground text-sm',
  },
})
export class HlmCardDescription {}
