import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmLabelImports } from '@spartan-ng/helm/label';
import { HlmToasterImports } from '@spartan-ng/helm/sonner';
import { PageTitleService } from './services/page-title.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HlmButtonImports, HlmInputImports, HlmLabelImports, HlmToasterImports],
  templateUrl: './app.html',
})
export class App {
  constructor(private readonly pageTitleService: PageTitleService) {
    void this.pageTitleService;
  }
}
