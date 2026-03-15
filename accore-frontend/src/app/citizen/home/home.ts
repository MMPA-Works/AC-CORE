import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmIcon } from '@spartan-ng/helm/icon';
import { HlmAccordionImports } from '@spartan-ng/helm/accordion';
import { NgIcon, provideIcons } from '@ng-icons/core';

import { 
  lucideMapPin, 
  lucideCamera, 
  lucideCheckCircle,
  lucideConstruction,
  lucideTrash2,
  lucideTreePine,
  lucideLightbulbOff,
  lucideLandmark,
  lucideRadar,
  lucideShieldCheck,
  lucideZap,
  lucideChevronDown
} from '@ng-icons/lucide';

import { CitizenHeaderComponent } from '../components/citizen-header/citizen-header';
import { CitizenFooterComponent } from '../components/citizen-footer/citizen-footer';

interface FaqItem {
  question: string;
  answer: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule, 
    RouterLink, 
    HlmButtonImports,
    HlmCardImports,
    HlmAccordionImports,
    HlmIcon,
    NgIcon,
    CitizenHeaderComponent,
    CitizenFooterComponent
  ],
  providers: [
    provideIcons({ 
      lucideMapPin, 
      lucideCamera, 
      lucideCheckCircle,
      lucideConstruction,
      lucideTrash2,
      lucideTreePine,
      lucideLightbulbOff,
      lucideLandmark,
      lucideRadar,
      lucideShieldCheck,
      lucideZap,
      lucideChevronDown
    })
  ],
  templateUrl: './home.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Home {
  
  readonly faqs = signal<FaqItem[]>([
    {
      question: 'Do I need an account to report a hazard?',
      answer: 'No. AC-CORE features a Quick Report option for guests. However, creating a free account gives you a personal dashboard to securely manage multiple reports and receive direct updates.'
    },
    {
      question: 'How do I know if my report is being worked on?',
      answer: 'Our system uses a live step-by-step progress tracker. You can watch your report move from Submitted to Acknowledged, In Progress, and Resolved in real time.'
    },
    {
      question: 'Can I upload photos of the issue?',
      answer: 'Yes. You can securely upload images directly from your mobile device. Our cloud system processes these photos so city field teams can assess the situation before arriving on site.'
    },
    {
      question: 'Does the system track location and weather automatically?',
      answer: 'Yes. AC-CORE uses advanced geo-location utilities to drop a precise pin on the map. It also integrates live weather data to help city departments prioritize critical issues during severe conditions.'
    },
    {
      question: 'Is my personal information secure?',
      answer: 'Absolutely. The platform is built with strict adherence to the Philippine Data Privacy Act. Your personal details are encrypted and only used to verify reports and send you updates.'
    }
  ]);

}