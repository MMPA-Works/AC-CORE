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
    password: ['', Validators.required],
    rememberMe: [false]
  });

  onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);

    const { email, password, rememberMe } = this.loginForm.value;

    this.authService.login({ email, password }).subscribe({
      next: (res: any) => {
        this.isLoading.set(false);

        // Store token based on "Remember Me" choice
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
          toast.error('Too many login attempts. Please try again later.');
        } else {
          toast.error(err.error?.message || 'Invalid credentials');
        }
      }
    });
  }
}