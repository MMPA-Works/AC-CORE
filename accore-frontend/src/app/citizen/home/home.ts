import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmIcon } from '@spartan-ng/helm/icon';
import { NgIcon, provideIcons } from '@ng-icons/core';

import { 
  lucideMapPin, 
  lucideCamera, 
  lucideCheckCircle,
  lucideConstruction,
  lucideWaves,
  lucideDroplets,
  lucideTreePine,
  lucideLightbulbOff
} from '@ng-icons/lucide';

import { CitizenFooterComponent } from '../components/citizen-footer/citizen-footer';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule, 
    RouterLink, 
    HlmButtonImports,
    HlmCardImports,
    HlmIcon,
    NgIcon,
    CitizenFooterComponent
  ],
  providers: [
    provideIcons({ 
      lucideMapPin, 
      lucideCamera, 
      lucideCheckCircle,
      lucideConstruction,
      lucideWaves,
      lucideDroplets,
      lucideTreePine,
      lucideLightbulbOff
    })
  ],
  templateUrl: './home.html'
})
export class Home {

}