import { Component } from '@angular/core';

@Component({
  selector: 'app-privacy',
  standalone: true,
  template: `
    <article class="space-y-12 text-neutral-700 leading-loose">
      <header class="border-b border-neutral-200 pb-8 mb-12">
        <div class="mb-6 inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase tracking-widest text-amber-900">
          Academic Project Notice
        </div>
        <h1 class="text-4xl md:text-5xl font-extrabold tracking-tight text-neutral-900 mb-4">Privacy Policy</h1>
        <p class="text-sm font-bold text-neutral-400 uppercase tracking-widest">Effective Date: March 15, 2026</p>
      </header>
      
      <div class="space-y-10">
        <div class="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
          <strong>Disclaimer:</strong> AC-CORE is a university academic project and portfolio piece. It is not affiliated with, endorsed by, or connected to the actual City Government of Angeles. Any data submitted to this platform is for demonstration purposes only.
        </div>

        <p class="text-lg text-neutral-600">
          This privacy policy explains how data is handled within this demonstration environment. While this is a mock application, it is designed to showcase compliance with standard data protection principles.
        </p>

        <section>
          <h2 class="text-2xl font-bold text-neutral-900 mb-4">1. Information Collection</h2>
          <p class="mb-4">In this demonstration, the application simulates the collection of the following data:</p>
          <ul class="list-disc ml-6 space-y-3 marker:text-neutral-400">
            <li><strong>Personal Information:</strong> Mock names and email addresses used during test account creation.</li>
            <li><strong>Location Data (GPS):</strong> Location coordinates captured when testing the map and reporting features.</li>
            <li><strong>Photographs:</strong> Sample images uploaded to test the hazard reporting workflow.</li>
          </ul>
        </section>

        <section>
          <h2 class="text-2xl font-bold text-neutral-900 mb-4">2. Purpose of Data</h2>
          <p>
            Any information entered into this application is used solely to demonstrate the software functionality. The data is stored in a test database and is not routed to any real municipal departments or emergency services.
          </p>
        </section>

        <section>
          <h2 class="text-2xl font-bold text-neutral-900 mb-4">3. Data Management</h2>
          <p class="mb-4">
            If you are testing this application and wish to have your sample data removed from the test database, please contact the project administrator:
          </p>
          <div class="bg-neutral-50 rounded-xl p-6 border border-neutral-200">
            <ul class="space-y-2 text-sm">
              <li><strong>Role:</strong> Project Administrator (Academic Portfolio)</li>
              <li><strong>Email:</strong> accore.angelescity&#64;gmail.com</li>
            </ul>
          </div>
        </section>
      </div>
    </article>
  `
})
export class PrivacyComponent {}