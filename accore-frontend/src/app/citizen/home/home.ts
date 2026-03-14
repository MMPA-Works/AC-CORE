import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { CitizenFooterComponent } from '../components/citizen-footer/citizen-footer';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterModule, HlmButtonImports, CitizenFooterComponent],
  templateUrl: './home.html',
})
export class Home {}