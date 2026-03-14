import { Component } from '@angular/core';

@Component({
  selector: 'app-privacy',
  standalone: true,
  template: `
    <div class="space-y-6">
      <header class="border-b border-neutral-100 pb-6">
        <h1 class="text-3xl font-bold tracking-tight text-neutral-900">Privacy Policy</h1>
        <p class="mt-2 text-sm text-neutral-500">Effective Date: March 2026</p>
      </header>
      
      <div class="space-y-8 text-neutral-600 leading-relaxed">
        <section>
          <h2 class="text-lg font-bold text-neutral-800">1. Information We Collect</h2>
          <p class="mt-2">To provide efficient infrastructure maintenance, AC-CORE collects:</p>
          <ul class="list-disc ml-5 mt-2 space-y-1">
            <li><strong>Account Data:</strong> Name and Barangay provided during signup.</li>
            <li><strong>Hazard Data:</strong> Photos, descriptions, and precise GPS coordinates when reporting.</li>
            <li><strong>Technical Data:</strong> Device type and IP address for security logging.</li>
          </ul>
        </section>

        <section>
          <h2 class="text-lg font-bold text-neutral-800">2. How We Use Your Data</h2>
          <p class="mt-2">Your information is used solely by the City Engineer's Office and ACDRRM to locate, verify, and repair infrastructure hazards. We do not share personal identities on the public live map.</p>
        </section>

        <section>
          <h2 class="text-lg font-bold text-neutral-800">3. Data Retention</h2>
          <p class="mt-2">Reports and associated media are archived for five (5) years to maintain city maintenance records and historical infrastructure data.</p>
        </section>
      </div>
    </div>
  `
})
export class PrivacyComponent {}