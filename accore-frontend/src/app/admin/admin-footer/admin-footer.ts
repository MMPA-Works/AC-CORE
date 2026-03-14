import { Component } from '@angular/core';

@Component({
  selector: 'app-admin-footer',
  standalone: true,
  templateUrl: './admin-footer.html',
})
export class AdminFooter {
  currentYear = new Date().getFullYear();
}
