import { Component } from '@angular/core';

@Component({
  selector: 'app-tracking',
  standalone: true,
  template: `
    <article class="space-y-12 text-neutral-700 leading-loose">
      <header class="border-b border-neutral-200 pb-8 mb-12">
        <h1 class="text-4xl md:text-5xl font-extrabold tracking-tight text-neutral-900 mb-4">Tracking & Local Storage Policy</h1>
        <p class="text-sm font-bold text-neutral-400 uppercase tracking-widest">Effective Date: March 15, 2026</p>
      </header>
      
      <div class="space-y-10">
        <p class="text-lg text-neutral-600">
          AC-CORE uses HTML5 Local Storage and Session Storage to make the application fast and reliable. Under Philippine law, these are treated similarly to traditional browser cookies.
        </p>

        <section>
          <h2 class="text-2xl font-bold text-neutral-900 mb-4">1. How We Store Data on Your Device</h2>
          <ul class="list-disc ml-6 space-y-4 marker:text-neutral-400">
            <li>
              <strong>Session Storage:</strong> This keeps you logged in securely while you use the app. This data is completely erased the moment you close your browser.
            </li>
            <li>
              <strong>Local Storage:</strong> We use this to save your report drafts directly on your phone or computer. This ensures you do not lose your progress if your internet connection drops. You can clear this storage at any time using your browser settings.
            </li>
          </ul>
        </section>
      </div>
    </article>
  `
})
export class TrackingComponent {}