import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import imageCompression from 'browser-image-compression';

import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmLabelImports } from '@spartan-ng/helm/label';
import { BrnSelectImports } from '@spartan-ng/brain/select';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { HlmTextareaImports } from '@spartan-ng/helm/textarea';
import { HlmSpinnerImports } from '@spartan-ng/helm/spinner';

import { HazardReportService } from '../../services/hazard-report';
import { BarangayService } from '../../services/barangay'; 
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
    BrnSelectImports,
    HlmSelectImports,
    HlmTextareaImports,
    HlmSpinnerImports,
  ],
  templateUrl: './report.html',
})
export class Report implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private hazardReportService = inject(HazardReportService);
  private barangayService = inject(BarangayService); 

  private map: L.Map | undefined;
  private marker: L.Marker | undefined;

  readonly barangays = [
    'Agapito del Rosario',
    'Amsic',
    'Anunas',
    'Balibago',
    'Capaya',
    'Claro M. Recto',
    'Cuayan',
    'Cutcut',
    'Cutud',
    'Lourdes North West',
    'Lourdes Sur',
    'Lourdes Sur East',
    'Malabañas',
    'Margot',
    'Mining',
    'Ninoy Aquino',
    'Pampang',
    'Pandan',
    'Pulung Cacutud',
    'Pulung Maragul',
    'Pulungbulu',
    'Salapungan',
    'San Jose',
    'San Nicolas',
    'Santa Teresita',
    'Santa Trinidad',
    'Santo Cristo',
    'Santo Domingo',
    'Santo Rosario',
    'Sapalibutad',
    'Sapangbato',
    'Tabun',
    'Virgen Delos Remedios',
  ];

  reportForm: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(100)]],
    category: ['', Validators.required],
    severity: ['', Validators.required],
    // The field is locked so users cannot manually select the wrong location
    barangay: [{ value: '', disabled: true }, Validators.required],
    description: ['', Validators.required],
    latitude: [15.145],
    longitude: [120.5887],
  });

  selectedFile: File | null = null;

  isSubmitting = signal(false);
  isCompressing = signal(false);
  statusMessage = signal('');
  isError = signal(false);

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

    this.barangayService.getNearestBarangay(lng, lat).subscribe({
      next: (response) => {
        if (response && response.data && response.data.name) {
          this.reportForm.patchValue({
            barangay: response.data.name,
          });
          this.statusMessage.set('');
          this.isError.set(false);
        }
      },
      error: (error) => {
        this.reportForm.patchValue({
          barangay: '',
        });

        this.statusMessage.set(
          'The selected location is outside Angeles City. Please move the pin.',
        );
        this.isError.set(true);
      },
    });
  }

  async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const originalFile = input.files[0];

      const options = {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1280,
        useWebWorker: true,
      };

      try {
        this.isCompressing.set(true);
        this.statusMessage.set('Optimizing image...');

        const compressedBlob = await imageCompression(originalFile, options);

        this.selectedFile = new File([compressedBlob], originalFile.name, {
          type: compressedBlob.type,
          lastModified: Date.now(),
        });

        this.isCompressing.set(false);
        this.statusMessage.set('');
      } catch (error) {
        console.error('Error compressing image:', error);
        this.selectedFile = originalFile;
        this.isCompressing.set(false);
        this.statusMessage.set('');
      }
    }
  }

  onSubmit() {
    // We retrieve the form values first to check the disabled barangay field
    const formValues = this.reportForm.getRawValue();

    if (!formValues.barangay) {
      this.statusMessage.set('You cannot submit a report outside Angeles City.');
      this.isError.set(true);
      return;
    }

    if (this.reportForm.invalid || !this.selectedFile) {
      this.statusMessage.set('Please fill all required fields and select an image.');
      this.isError.set(true);
      return;
    }

    this.isSubmitting.set(true);
    this.statusMessage.set('');
    this.isError.set(false);

    const formData = new FormData();
    formData.append('image', this.selectedFile);
    formData.append('title', formValues.title);
    formData.append('category', formValues.category);
    formData.append('severity', formValues.severity);
    formData.append('barangay', formValues.barangay);
    formData.append('description', formValues.description);
    formData.append('latitude', formValues.latitude);
    formData.append('longitude', formValues.longitude);

    this.hazardReportService.submitReport(formData).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.statusMessage.set('Report submitted successfully.');
        this.isError.set(false);

        this.reportForm.reset({ latitude: 15.145, longitude: 120.5887 });
        this.marker?.setLatLng([15.145, 120.5887]);
        this.map?.setView([15.145, 120.5887], 13);
        this.selectedFile = null;
      },
      error: () => {
        this.isSubmitting.set(false);
        this.statusMessage.set('Failed to submit the report. Please try again.');
        this.isError.set(true);
      },
    });
  }
}