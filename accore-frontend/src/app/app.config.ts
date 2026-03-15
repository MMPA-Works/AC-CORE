import {
  ApplicationConfig,
  provideZonelessChangeDetection,
  importProvidersFrom,
} from '@angular/core';

import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { authInterceptor } from './shared/auth.interceptor';

import {
  SocialLoginModule,
  SOCIAL_AUTH_CONFIG,
  SocialAuthServiceConfig,
  GoogleLoginProvider,
} from '@abacritt/angularx-social-login';

import {
  LucideAngularModule,
  LayoutDashboard,
  Map,
  Radio,
  BarChart3,
  Users,
  Settings,
  LogOut,
  ShieldAlert,
  MapPin,
  Clock,
  AlertTriangle,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  AlignLeft,
  Check,
  CheckCircle2,
  History,
  ImageOff,
  Loader2,
  X,
  Menu,
  User,
  UploadCloud,
  Camera,
  Navigation,
  Download,
  ShieldCheck,
  Tag,
  AlertCircle,
  Flame,
  Search,
  Hammer,
  TrendingUp,
  Grip,
  Plus,
  Activity,
} from 'lucide-angular';

import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

// Centralized hazard categories
export const HAZARD_CATEGORIES = [
  'Pothole',
  'Uneven Sidewalk',
  'Clogged Drain',
  'Flooding',
  'Uncollected Garbage',
  'Illegal Dumping',
  'Streetlight Out',
  'Leaking Pipe',
  'Fallen Tree',
  'Overgrown Vegetation',
  'Other'
] as const;

export type HazardCategory = typeof HAZARD_CATEGORIES[number];
export type HazardSeverity = 'Low' | 'Medium' | 'Critical';

export const APP_CONFIG = {
  apiBaseUrl: 'http://localhost:5000/api',

  map: {
    defaultLat: 15.145,
    defaultLng: 120.5887,
    defaultZoom: 13,
    activeZoom: 16,
    scrollWheel: true,
  },

  image: {
    maxSizeMB: 0.5,
    maxWidthOrHeight: 1280,
  },

  severityMapping: {
    'Pothole': 'Medium',
    'Uneven Sidewalk': 'Low',
    'Clogged Drain': 'Medium',
    'Flooding': 'Critical',
    'Uncollected Garbage': 'Low',
    'Illegal Dumping': 'Medium',
    'Streetlight Out': 'Low',
    'Leaking Pipe': 'Critical',
    'Fallen Tree': 'Critical',
    'Overgrown Vegetation': 'Low',
    'Other': 'Medium',
  } as Record<HazardCategory, HazardSeverity>,
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    provideCharts(withDefaultRegisterables()),

    importProvidersFrom(
      SocialLoginModule,
      LucideAngularModule.pick({
        LayoutDashboard, Map, Radio, BarChart3, Users, Settings, LogOut,
        ShieldAlert, MapPin, Clock, AlertTriangle, CalendarDays, ChevronDown,
        ChevronLeft, ChevronRight, AlignLeft, Check, CheckCircle2, History,
        ImageOff, Loader2, X, Menu, User, UploadCloud, Camera, Navigation,
        Download, ShieldCheck, Tag, AlertCircle, Flame, Search, Hammer,
        TrendingUp, Grip, Plus, Activity,
      }),
    ),

    {
      provide: SOCIAL_AUTH_CONFIG,
      useValue: {
        autoLogin: false,
        providers: [
          {
            id: GoogleLoginProvider.PROVIDER_ID,
            provider: new GoogleLoginProvider(
              '184337788465-d57oaputgh4s9vvc384sbe6olrvc8ffd.apps.googleusercontent.com',
              { prompt: 'select_account' },
            ),
          },
        ],
      } as SocialAuthServiceConfig,
    },
  ],
};