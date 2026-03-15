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
    HlmToasterImports,
  ],
  templateUrl: './login.html',
})
export class Login {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  isLoading = signal(false);
  authError = signal('');

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
    rememberMe: [false],
  });

  onSubmit() {
    this.authError.set('');

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      toast.error('Please enter valid credentials.');
      return;
    }

    this.isLoading.set(true);

    const { email, password, rememberMe } = this.loginForm.value;

    this.authService.login({ email, password }).subscribe({
      next: (res: any) => {
        this.isLoading.set(false);

        if (!res?.token) {
          toast.error('Login failed: Token missing.');
          return;
        }

        if (rememberMe) {
          localStorage.setItem('authToken', res.token);
        } else {
          sessionStorage.setItem('authToken', res.token);
        }

        toast.success('Welcome back!');
        this.router.navigate(['/admin/dashboard']);
      },

      error: (err) => {
        this.isLoading.set(false);

        if (err.status === 429) {
          this.authError.set('Too many login attempts. Please try again later.');
          toast.error('Too many login attempts. Please try again later.');
        } else if (err.status === 401) {
          this.authError.set('Invalid email or password.');
          toast.error('Invalid email or password.');
        } else {
          const errorMessage = err.error?.message || 'Login failed.';
          this.authError.set(errorMessage);
          toast.error(errorMessage);
        }
      },
    });
  }

  clearAuthError(): void {
    if (this.authError()) {
      this.authError.set('');
    }
  }

  hasControlError(controlName: 'email' | 'password'): boolean {
    const control = this.loginForm.controls[controlName];
    return !!control.errors && control.touched;
  }

  getControlError(controlName: 'email' | 'password'): string | null {
    const control = this.loginForm.controls[controlName];

    if (!control.touched || !control.errors) {
      return null;
    }

    if (control.errors['required']) {
      return controlName === 'email'
        ? 'Email address is required.'
        : 'Password is required.';
    }

    if (controlName === 'email' && control.errors['email']) {
      return 'Enter a valid email address.';
    }

    return null;
  }
}
