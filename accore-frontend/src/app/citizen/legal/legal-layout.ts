import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CitizenHeaderComponent } from '../components/citizen-header/citizen-header';
import { CitizenFooterComponent } from '../components/citizen-footer/citizen-footer';

@Component({
  selector: 'app-legal-layout',
  standalone: true,
  imports: [RouterOutlet, CitizenHeaderComponent, CitizenFooterComponent],
  template: `
    <div class="flex min-h-screen flex-col bg-white selection:bg-neutral-200 selection:text-neutral-900">
      <app-citizen-header />
      <main class="flex-grow pt-20 pb-32">
        <div class="mx-auto max-w-3xl px-6 md:px-8">
          <router-outlet />
        </div>
      </main>
      <app-citizen-footer />
    </div>
  `
})
export class LegalLayout {}