import { Component } from '@angular/core';

@Component({
  selector: 'app-cookies',
  standalone: true,
  template: `
    <div class="space-y-6">
      <header class="border-b border-neutral-100 pb-6">
        <h1 class="text-3xl font-bold tracking-tight text-neutral-900">Cookie Policy</h1>
        <p class="mt-2 text-sm text-neutral-500">Effective Date: March 2026</p>
      </header>
      
      <div class="space-y-8 text-neutral-600 leading-relaxed">
        <section>
          <h2 class="text-lg font-bold text-neutral-800">1. What are Cookies?</h2>
          <p class="mt-2">Cookies are small text files stored on your device to help AC-CORE function properly and remember your preferences.</p>
        </section>

        <section>
          <h2 class="text-lg font-bold text-neutral-800">2. Essential Cookies</h2>
          <p class="mt-2">We use essential cookies to keep you logged in and to remember your map viewport settings (zoom and location) for a better reporting experience.</p>
        </section>

        <section>
          <h2 class="text-lg font-bold text-neutral-800">3. Analytics</h2>
          <p class="mt-2">We may use anonymized analytics to understand which barangays are most active, helping the city allocate maintenance resources more effectively.</p>
        </section>
      </div>
    </div>
  `
})
export class CookiesComponent {}