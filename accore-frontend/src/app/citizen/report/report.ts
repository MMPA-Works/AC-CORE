import { Component, inject, OnInit, OnDestroy, signal, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import imageCompression from 'browser-image-compression';
import { LucideAngularModule } from 'lucide-angular';

import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmLabelImports } from '@spartan-ng/helm/label';
import { BrnSelectImports } from '@spartan-ng/brain/select';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { HlmTextareaImports } from '@spartan-ng/helm/textarea';
import { HlmSpinnerImports } from '@spartan-ng/helm/spinner';

import { HazardReportService } from '../../services/hazard-report';
import { BarangayService } from '../../services/barangay';
import { APP_CONFIG } from '../../app.config';
import * as L from 'leaflet';

@Component({
  selector: 'app-report',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterModule, LucideAngularModule,
    HlmButtonImports, HlmInputImports, HlmLabelImports,
    BrnSelectImports, HlmSelectImports, HlmTextareaImports, HlmSpinnerImports,
  ],
  templateUrl: './report.html',
})
export class Report implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);
  private hazardService = inject(HazardReportService);
  private barangayService = inject(BarangayService);

  private map?: L.Map;
  private marker?: L.Marker;

  isSubmitting = signal(false);
  isCompressing = signal(false);
  isLocating = signal(false);
  showUpload = signal(false);
  statusMessage = signal('');
  isError = signal(false);
  imagePreview = signal<string | null>(null);
  selectedFile: File | null = null;

  reportForm = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(100)]],
    category: ['', Validators.required],
    severity: ['', Validators.required],
    barangay: [{ value: '', disabled: true }, Validators.required],
    description: ['', Validators.required],
    latitude: [APP_CONFIG.map.defaultLat],
    longitude: [APP_CONFIG.map.defaultLng],
  });

  ngOnInit() {
    setTimeout(() => {
      this.initMap();
      this.setupAutoSuggest();
    }, 0);
  }

  ngOnDestroy() {
    this.map?.remove();
  }

  private initMap() {
    const start: [number, number] = [APP_CONFIG.map.defaultLat, APP_CONFIG.map.defaultLng];
    
    this.map = L.map('map', { 
      scrollWheelZoom: APP_CONFIG.map.scrollWheel,
      zoomControl: false 
    }).setView(start, APP_CONFIG.map.defaultZoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(this.map);

    const teardropPin = L.divIcon({
      className: 'bg-transparent border-0',
      html: `
        <div class="relative flex flex-col items-center justify-center">
          <div class="flex items-center justify-center w-10 h-10 bg-red-800 rounded-full shadow-lg border-2 border-white z-10">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div class="w-3 h-3 bg-red-800 rotate-45 -mt-2 border-r-2 border-b-2 border-white z-0"></div>
        </div>`,
      iconSize: [40, 48],
      iconAnchor: [20, 48],
    });

    this.marker = L.marker(start, { draggable: true, icon: teardropPin }).addTo(this.map);

    this.marker.on('dragend', () => {
      this.ngZone.run(() => this.handlePinMovement());
    });
    
    this.map.on('click', (e) => {
      this.marker?.setLatLng(e.latlng);
      this.ngZone.run(() => this.handlePinMovement());
    });

    this.locateUser();
  }

  private locateUser() {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        this.map?.flyTo(coords, APP_CONFIG.map.activeZoom);
        this.marker?.setLatLng(coords);
        this.ngZone.run(() => this.handlePinMovement());
      });
    }
  }

  private handlePinMovement() {
    const pos = this.marker?.getLatLng();
    if (!pos) return;

    this.reportForm.patchValue({ latitude: pos.lat, longitude: pos.lng });
    this.isLocating.set(true);
    this.cdr.detectChanges(); 

    this.barangayService.getNearestBarangay(pos.lng, pos.lat).subscribe({
      next: (res) => {
        const name = res?.data?.name;
        this.reportForm.patchValue({ barangay: name || '' });
        this.isError.set(!name);
        this.statusMessage.set(name ? '' : 'Please move the pin inside Angeles City territory.');
        this.isLocating.set(false);
        this.cdr.detectChanges();
      },
      error: () => {
        this.reportForm.patchValue({ barangay: '' });
        this.isError.set(true);
        this.statusMessage.set('Location not recognized. Pin within city boundaries.');
        this.isLocating.set(false);
        this.cdr.detectChanges();
      }
    });
  }

  private setupAutoSuggest() {
    this.reportForm.get('category')?.valueChanges.subscribe(cat => {
      if (cat && APP_CONFIG.severityMapping[cat]) {
        this.reportForm.patchValue({ severity: APP_CONFIG.severityMapping[cat] });
      }
    });
  }

  async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    
    if (!input.files || input.files.length === 0) {
      return;
    }
    
    // Using .item(0) avoids formatting issues with square brackets
    const file = input.files.item(0);

    if (!file) {
      return;
    }

    this.isCompressing.set(true);
    try {
      const compressed = await imageCompression(file, APP_CONFIG.image);
      this.selectedFile = new File([compressed], file.name, { type: file.type });
      
      const reader = new FileReader();
      reader.onload = () => this.imagePreview.set(reader.result as string);
      reader.readAsDataURL(this.selectedFile);
    } catch (e) {
      this.statusMessage.set('Failed to process image.');
    } finally {
      this.isCompressing.set(false);
    }
  }

  removeImage() {
    this.selectedFile = null;
    this.imagePreview.set(null);
    this.showUpload.set(false);
  }

  onSubmit() {
    const data = this.reportForm.getRawValue();
    if (this.reportForm.invalid || !this.selectedFile || !data.barangay) return;

    this.isSubmitting.set(true);
    const fd = new FormData();
    Object.entries(data).forEach(([k, v]) => fd.append(k, v as string));
    fd.append('image', this.selectedFile);

    this.hazardService.submitReport(fd).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.statusMessage.set('Hazard report submitted. Thank you for your civic contribution!');
        this.isError.set(false);
        this.reset();
      },
      error: () => {
        this.isSubmitting.set(false);
        this.statusMessage.set('Submission failed. Check your network or image size.');
        this.isError.set(true);
      }
    });
  }

  private reset() {
    this.reportForm.reset({ latitude: APP_CONFIG.map.defaultLat, longitude: APP_CONFIG.map.defaultLng });
    this.removeImage();
    this.marker?.setLatLng([APP_CONFIG.map.defaultLat, APP_CONFIG.map.defaultLng]);
  }
}