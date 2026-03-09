import { ApplicationConfig, provideZonelessChangeDetection, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { routes } from './app.routes';
import { SocialLoginModule, SocialAuthServiceConfig, GoogleLoginProvider } from '@abacritt/angularx-social-login';

import { LucideAngularModule, LayoutDashboard, Map, Radio, BarChart3, Users, Settings, LogOut, ShieldAlert, MapPin, Clock, AlertTriangle, ChevronDown, CheckCircle2, Loader2, X, Menu } from 'lucide-angular';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideHttpClient(withFetch()),
    importProvidersFrom(
      SocialLoginModule,
      LucideAngularModule.pick({ LayoutDashboard, Map, Radio, BarChart3, Users, Settings, LogOut, ShieldAlert, MapPin, Clock, AlertTriangle, ChevronDown, CheckCircle2, Loader2, X, Menu })
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
              {
                prompt: 'select_account' 
              }
            )
          }
        ],
        onError: (error) => {
          console.error(error);
        }
      } as SocialAuthServiceConfig,
    }
  ]
};