import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CitizenHeaderComponent } from '../components/citizen-header/citizen-header';
import { CitizenFooterComponent } from '../components/citizen-footer/citizen-footer';

@Component({
  selector: 'app-legal-layout',
  standalone: true,
  imports: [RouterOutlet, CitizenHeaderComponent, CitizenFooterComponent],
  template: `
    <div class="flex min-h-screen flex-col bg-neutral-50">
      <app-citizen-header />
      <main class="flex-grow pt-24 pb-16">
        <div class="mx-auto max-w-4xl px-4 md:px-6">
          <div class="rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm md:p-12">
            <router-outlet />
          </div>
        </div>
      </main>
      <app-citizen-footer />
    </div>
  `
})
export class LegalLayout {}