import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmLabelImports } from '@spartan-ng/helm/label';
import { HazardReportService } from '../../services/hazard-report';
import * as L from 'leaflet';

@Component({
  selector: 'app-report',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    HlmButtonImports,
    HlmInputImports,
    HlmLabelImports,
  ],
  templateUrl: './report.html',
})
export class Report implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private hazardReportService = inject(HazardReportService);

  private map: L.Map | undefined;
  private marker: L.Marker | undefined;

  // Default Angeles City coordinates are kept as a safe fallback
  reportForm: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(100)]],
    category: ['', Validators.required],
    severity: ['', Validators.required],
    barangay: ['', Validators.required],
    description: ['', Validators.required],
    latitude: [15.145],
    longitude: [120.5887],
  });

  selectedFile: File | null = null;
  isSubmitting = false;
  statusMessage = '';
  isError = false;

  ngOnInit() {
    this.initMap();
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
    }
  }

  private initMap(): void {
    const defaultLat = this.reportForm.get('latitude')?.value;
    const defaultLng = this.reportForm.get('longitude')?.value;

    this.map = L.map('map').setView([defaultLat, defaultLng], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(this.map);

    const alertPin = L.divIcon({
      className: 'bg-transparent border-0',
      html: `
        <div class="relative flex flex-col items-center justify-center">
          <div class="flex items-center justify-center w-10 h-10 bg-red-600 rounded-full shadow-lg border-2 border-white z-10">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div class="w-3 h-3 bg-red-600 rotate-45 -mt-2 border-r-2 border-b-2 border-white z-0"></div>
        </div>
      `,
      iconSize: [40, 48],
      iconAnchor: [20, 48],
    });

    this.marker = L.marker([defaultLat, defaultLng], {
      draggable: true,
      icon: alertPin,
    }).addTo(this.map);

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;
      this.marker?.setLatLng([lat, lng]);
      this.updateCoordinates(lat, lng);
    });

    this.marker.on('dragend', () => {
      const position = this.marker?.getLatLng();
      if (position) {
        this.updateCoordinates(position.lat, position.lng);
      }
    });

    this.locateUser();
  }

  private locateUser(): void {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLat = position.coords.latitude;
          const userLng = position.coords.longitude;

          // Fly to the user's actual location with a smooth animation
          this.map?.flyTo([userLat, userLng], 16, { duration: 1.5 });
          this.marker?.setLatLng([userLat, userLng]);
          this.updateCoordinates(userLat, userLng);
        },
        (error) => {
          console.warn('Geolocation failed or was denied by the user.', error);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 },
      );
    }
  }

  private updateCoordinates(lat: number, lng: number) {
    this.reportForm.patchValue({
      latitude: lat,
      longitude: lng,
    });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    }
  }

  onSubmit() {
    if (this.reportForm.invalid || !this.selectedFile) {
      this.statusMessage = 'Please fill all required fields and select an image.';
      this.isError = true;
      return;
    }

    this.isSubmitting = true;
    this.statusMessage = '';
    this.isError = false;

    const formData = new FormData();
    formData.append('image', this.selectedFile);
    formData.append('title', this.reportForm.get('title')?.value);
    formData.append('category', this.reportForm.get('category')?.value);
    formData.append('severity', this.reportForm.get('severity')?.value);
    formData.append('barangay', this.reportForm.get('barangay')?.value);
    formData.append('description', this.reportForm.get('description')?.value);
    formData.append('latitude', this.reportForm.get('latitude')?.value);
    formData.append('longitude', this.reportForm.get('longitude')?.value);

    this.hazardReportService.submitReport(formData).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.statusMessage = 'Report submitted successfully.';
        this.isError = false;

        this.reportForm.reset({ latitude: 15.145, longitude: 120.5887 });
        this.marker?.setLatLng([15.145, 120.5887]);
        this.map?.setView([15.145, 120.5887], 13);
        this.selectedFile = null;
      },
      error: () => {
        this.isSubmitting = false;
        this.statusMessage = 'Failed to submit the report. Please try again.';
        this.isError = true;
      },
    });
  }
}
