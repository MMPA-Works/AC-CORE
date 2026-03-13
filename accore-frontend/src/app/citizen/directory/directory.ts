import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmAccordionImports } from '@spartan-ng/helm/accordion';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmIconImports } from '@spartan-ng/helm/icon';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { CitizenHeaderComponent } from '../components/citizen-header/citizen-header';
import { CitizenFooterComponent } from '../components/citizen-footer/citizen-footer';
import { lucidePhone, lucideInfo, lucideChevronDown, lucideSiren, lucideDroplets, lucideActivity, lucideShield } from '@ng-icons/lucide';

interface Hotline {
  label: string;
  number: string;
  tel: string;
}

interface EmergencyContact {
  name: string;
  description: string;
  hotlines: Hotline[];
}

interface ContactCategory {
  categoryName: string;
  icon: string;
  contacts: EmergencyContact[];
}

interface FaqItem {
  question: string;
  answer: string;
}

@Component({
  selector: 'app-directory',
  standalone: true,
  imports: [
    CommonModule, 
    HlmCardImports, 
    HlmAccordionImports, 
    HlmButtonImports, 
    HlmIconImports,
    NgIcon,
    CitizenHeaderComponent,
    CitizenFooterComponent
  ],
  providers: [provideIcons({ lucidePhone, lucideInfo, lucideChevronDown, lucideSiren, lucideDroplets, lucideActivity, lucideShield })],
  templateUrl: './directory.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Directory {
  
  readonly directoryData = signal<ContactCategory[]>([
    {
      categoryName: 'Disaster & Rescue (ACDRRMO)',
      icon: 'lucideSiren',
      contacts: [
        {
          name: 'City Disaster Risk Reduction Office',
          description: 'Primary command center for natural disasters and rescue operations.',
          hotlines: [
            { label: 'Landline', number: '(045) 322-7796', tel: '0453227796' },
            { label: 'Smart Mobile', number: '0998-842-7746', tel: '09988427746' },
            { label: 'Globe Mobile', number: '0917-851-9581', tel: '09178519581' }
          ]
        }
      ]
    },
    {
      categoryName: 'Police & Fire Protection',
      icon: 'lucideShield',
      contacts: [
        {
          name: 'Angeles City Police Office (ACPO)',
          description: 'For crime reporting, public safety, and police assistance.',
          hotlines: [
            { label: 'Headquarters', number: '(045) 322-7247', tel: '0453227247' },
            { label: 'National Hotline', number: '911', tel: '911' }
          ]
        },
        {
          name: 'Bureau of Fire Protection (BFP)',
          description: 'For fire emergencies and medical first response.',
          hotlines: [
            { label: 'Local Station', number: '(045) 322-2333', tel: '0453222333' },
            { label: 'Region III Backup', number: '(045) 963-4376', tel: '0459634376' }
          ]
        }
      ]
    },
    {
      categoryName: 'Hospitals & Medical Centers',
      icon: 'lucideActivity',
      contacts: [
        {
          name: 'Rafael Lazatin Memorial Medical Center',
          description: 'Public hospital (Ospital Ning Angeles). Provides 24/7 emergency care.',
          hotlines: [
            { label: 'Emergency Room', number: '(045) 322-1222', tel: '0453221222' },
            { label: 'Telemedicine', number: '0915-927-0554', tel: '09159270554' }
          ]
        },
        {
          name: 'AUF Medical Center',
          description: 'Private tertiary hospital with advanced ICU facilities.',
          hotlines: [
            { label: 'Main Line', number: '(045) 625-2999', tel: '0456252999' },
            { label: 'Emergency Admitting', number: '0919-059-7235', tel: '09190597235' }
          ]
        },
        {
          name: 'Holy Family Medical Center',
          description: 'Private hospital located in the downtown area.',
          hotlines: [
            { label: 'Direct Line', number: '(045) 322-3623', tel: '0453223623' }
          ]
        }
      ]
    },
    {
      categoryName: 'Utilities & Social Services',
      icon: 'lucideDroplets',
      contacts: [
        {
          name: 'Angeles Electric Corporation',
          description: 'For reporting downed power lines and electrical outages.',
          hotlines: [
            { label: '24/7 Emergency Line', number: '(045) 888-2888', tel: '0458882888' }
          ]
        },
        {
          name: 'Angeles City Water District',
          description: 'For severe water interruptions and burst pipes.',
          hotlines: [
            { label: 'Emergency Hotline', number: '(045) 458-0372', tel: '0454580372' },
            { label: 'Alt Line', number: '(045) 323-6422', tel: '0453236422' }
          ]
        },
        {
          name: 'City Social Welfare (CSWDO)',
          description: 'For evacuation center info, relief goods, and missing persons.',
          hotlines: [
            { label: 'Crisis Hotline', number: '0935-211-7513', tel: '09352117513' }
          ]
        }
      ]
    }
  ]);

  readonly faqs = signal<FaqItem[]>([
    { 
      question: 'How do I report a hazard using this portal?', 
      answer: 'Navigate to the Report tab, select the hazard category, provide a brief description, and attach an image. The system automatically tags your location so responders can find the issue quickly.' 
    },
    { 
      question: 'How is this portal different from the Angeleño Alerto! POGI App?', 
      answer: 'The Angeleño Alerto! app is designed for immediate life-threatening emergencies requiring real-time tracking. This portal is best for reporting infrastructural hazards like broken pipes, potholes, or fallen trees to the proper maintenance departments.' 
    },
    { 
      question: 'What happens after I submit a hazard report?', 
      answer: 'Your report goes directly to the city administration dashboard. It will be reviewed and assigned to the proper department (such as the engineering office or DRRMO) for resolution.' 
    },
    { 
      question: 'Will I be updated on my report?', 
      answer: 'Yes. You can view the status of your reports in the My Reports section on your dashboard. The status will update from Reported to In Progress, and finally to Resolved.' 
    }
  ]);
}