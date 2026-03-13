import { Component } from '@angular/core';

@Component({
  selector: 'app-terms',
  standalone: true,
  template: `
    <div class="space-y-6">
      <header class="border-b border-neutral-100 pb-6">
        <h1 class="text-3xl font-bold tracking-tight text-neutral-900">Terms of Service</h1>
        <p class="mt-2 text-sm text-neutral-500">Effective Date: March 2026</p>
      </header>
      
      <div class="space-y-8 text-neutral-600 leading-relaxed">
        <section>
          <h2 class="text-lg font-bold text-neutral-800">1. Acceptance of Terms</h2>
          <p class="mt-2">By accessing AC-CORE, you agree to comply with the local ordinances of Angeles City regarding public reporting and digital conduct.</p>
        </section>

        <section>
          <h2 class="text-lg font-bold text-neutral-800">2. Reporting Guidelines</h2>
          <p class="mt-2">Users must provide truthful and accurate information. Submitting intentionally false or "prank" reports is strictly prohibited and may result in account suspension or legal action under applicable cyber-governance laws.</p>
        </section>

        <section>
          <h2 class="text-lg font-bold text-neutral-800">3. Prohibited Content</h2>
          <p class="mt-2">You may not upload media that is unrelated to infrastructure hazards, including but not limited to: promotional material, private individuals' faces without consent, or sensitive personal information.</p>
        </section>
      </div>
    </div>
  `
})
export class TermsComponent {}