import { Component } from '@angular/core';

@Component({
  selector: 'app-terms',
  standalone: true,
  template: `
    <article class="space-y-12 text-neutral-700 leading-loose">
      <header class="border-b border-neutral-200 pb-8 mb-12">
        <div class="mb-6 inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase tracking-widest text-amber-900">
          Academic Project Notice
        </div>
        <h1 class="text-4xl md:text-5xl font-extrabold tracking-tight text-neutral-900 mb-4">Terms of Service</h1>
        <p class="text-sm font-bold text-neutral-400 uppercase tracking-widest">Effective Date: March 15, 2026</p>
      </header>
      
      <div class="space-y-10">
        <div class="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
          <strong>Disclaimer:</strong> AC-CORE is a student portfolio project. It is not an official government platform. Do not use this application to report real emergencies or actual infrastructure hazards.
        </div>

        <p class="text-lg text-neutral-600">
          By using the AC-CORE demonstration environment, you acknowledge that this is a simulated platform built for educational purposes.
        </p>

        <section>
          <h2 class="text-2xl font-bold text-neutral-900 mb-4">1. Acceptable Use of the Demo</h2>
          <p>
            You may use this application to test its features, explore the user interface, and evaluate the development work. Please use mock data when testing the reporting functionalities.
          </p>
        </section>

        <section>
          <h2 class="text-2xl font-bold text-neutral-900 mb-4">2. Prohibited Conduct</h2>
          <p class="mb-4">To keep the test environment clean, please avoid the following:</p>
          <ul class="list-disc ml-6 space-y-3 marker:text-neutral-400">
            <li><strong>Graphic Content:</strong> Do not upload inappropriate, violent, or explicit images to the test server.</li>
            <li><strong>Malicious Testing:</strong> Do not attempt to breach the database or perform destructive actions outside normal usability testing.</li>
          </ul>
        </section>

        <section class="bg-neutral-100 p-8 rounded-2xl border border-neutral-200">
          <h2 class="text-2xl font-bold text-neutral-900 mb-4 flex items-center gap-2">
            3. No Real-World Action
          </h2>
          <p class="text-neutral-800 font-medium">
            Reports submitted here will not be seen or acted upon by any city officials. If you encounter a real hazard or emergency in Angeles City, you must contact the proper authorities directly by dialing 911 or the local CDRRMO hotlines.
          </p>
        </section>

        <section>
          <h2 class="text-2xl font-bold text-neutral-900 mb-4">4. Liability</h2>
          <p>
            The creator of this academic project holds no liability for any misunderstandings, data loss within the test environment, or actions taken by users who mistake this demo for an official government portal.
          </p>
        </section>
      </div>
    </article>
  `
})
export class TermsComponent {}