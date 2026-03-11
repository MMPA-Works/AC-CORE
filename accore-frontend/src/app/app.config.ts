import { ApplicationConfig, provideZonelessChangeDetection, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { routes } from './app.routes';
import { SocialLoginModule, SocialAuthServiceConfig, GoogleLoginProvider } from '@abacritt/angularx-social-login';
import { LucideAngularModule, LayoutDashboard, Map, Radio, BarChart3, Users, Settings, LogOut, ShieldAlert, MapPin, Clock, AlertTriangle, ChevronDown, CheckCircle2, Loader2, X, Menu, User, UploadCloud, Camera } from 'lucide-angular';

export const APP_CONFIG = {
  apiBaseUrl: 'http://localhost:5000/api', // Update to your actual backend URL
  map: {
    defaultLat: 15.145,
    defaultLng: 120.5887,
    defaultZoom: 13,
    activeZoom: 16,
    scrollWheel: true // Enabled for Desktop
  },
  image: {
    maxSizeMB: 0.5,
    maxWidthOrHeight: 1280,
  },
  severityMapping: {
    'Pothole': 'Medium',
    'Clogged Drain': 'Medium',
    'Fallen Tree': 'Critical',
    'Streetlight Out': 'Low',
    'Flooding': 'Critical'
  } as Record<string, string>
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideHttpClient(withFetch()),
    importProvidersFrom(
      SocialLoginModule,
      LucideAngularModule.pick({ LayoutDashboard, Map, Radio, BarChart3, Users, Settings, LogOut, ShieldAlert, MapPin, Clock, AlertTriangle, ChevronDown, CheckCircle2, Loader2, X, Menu, User, UploadCloud, Camera })
    ),
    {
      provide: 'SocialAuthServiceConfig',
      useValue: {
        autoLogin: false,
        providers: [
          {
            id: GoogleLoginProvider.PROVIDER_ID,
            provider: new GoogleLoginProvider(
              '184337788465-d57oaputgh4s9vvc384sbe6olrvc8ffd.apps.googleusercontent.com',
              { prompt: 'select_account' }
            )
          }
        ],
      } as SocialAuthServiceConfig,
    }
  ]
};