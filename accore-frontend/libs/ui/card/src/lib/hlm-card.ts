import { Directive } from '@angular/core';

@Directive({
  selector: '[hlmCard],hlm-card',
  host: {
    'data-slot': 'card',
    class: 'bg-card text-card-foreground flex flex-col gap-6 rounded-xl border border-border shadow-sm',
  },
})
export class HlmCard {}

@Directive({
  selector: '[hlmCardHeader],hlm-card-header',
  host: {
    'data-slot': 'card-header',
    class: 'grid auto-rows-min items-start gap-1.5 px-6 pt-6',
  },
})
export class HlmCardHeader {}

@Directive({
  selector: '[hlmCardTitle],hlm-card-title',
  host: {
    'data-slot': 'card-title',
    class: 'leading-none font-semibold',
  },
})
export class HlmCardTitle {}

@Directive({
  selector: '[hlmCardDescription],hlm-card-description',
  host: {
    'data-slot': 'card-description',
    class: 'text-muted-foreground text-sm',
  },
})
export class HlmCardDescription {}

@Directive({
  selector: '[hlmCardContent],hlm-card-content',
  host: {
    'data-slot': 'card-content',
    class: 'px-6',
  },
})
export class HlmCardContent {}

@Directive({
  selector: '[hlmCardFooter],hlm-card-footer',
  host: {
    'data-slot': 'card-footer',
    class: 'flex items-center px-6 pb-6',
  },
})
export class HlmCardFooter {}
