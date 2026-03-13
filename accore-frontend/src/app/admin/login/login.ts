import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmLabelImports } from '@spartan-ng/helm/label';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmToasterImports } from '@spartan-ng/helm/sonner';
import { toast } from 'ngx-sonner';
import { AuthService } from '../../shared/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    HlmInputImports,
    HlmLabelImports,
    HlmButtonImports,
    HlmToasterImports
  ],
  templateUrl: './login.html',
})
export class Login {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  isLoading = signal(false);

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);

    this.authService.login(this.loginForm.value).subscribe({
      next: () => {
        this.isLoading.set(false);
        toast.success('Welcome back!', {
          description: 'Redirecting to dashboard...'
        });
        this.router.navigate(['/admin/dashboard']);
      },
      error: (err) => {
        this.isLoading.set(false);
        // The CSS override in styles.css will handle the red icon
        toast.error('Invalid credentials', {
          description: 'Email or password is incorrect.'
        });
      }
    });
  }
}