import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { SocialAuthService, GoogleSigninButtonModule } from '@abacritt/angularx-social-login';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmLabelImports } from '@spartan-ng/helm/label';
import { HlmToasterImports } from '@spartan-ng/helm/sonner';
import { toast } from 'ngx-sonner';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    GoogleSigninButtonModule,
    HlmButtonImports,
    HlmInputImports,
    HlmLabelImports,
    HlmToasterImports,
  ],
  templateUrl: './login.html',
})
export class Login implements OnInit {
  private authService = inject(SocialAuthService);
  private http = inject(HttpClient);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  isLoading = signal(false);

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  ngOnInit() {
    if (!localStorage.getItem('token')) {
      this.authService.signOut().catch(() => {});
    }

    this.authService.authState.subscribe((user) => {
      if (user && user.idToken) this.handleGoogleLogin(user.idToken);
    });
  }

  handleGoogleLogin(token: string) {
    this.isLoading.set(true);

    this.http.post('http://localhost:5000/api/auth/citizen/google', { token }).subscribe({
      next: (response: any) => {
        localStorage.removeItem('adminToken');
        localStorage.setItem('token', response.token);
        toast.success('Login successful!');
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isLoading.set(false);

        if (err.status === 429) {
          toast.error('Too many login attempts. Please try again later.');
        } else {
          toast.error(err.error?.message || 'Google login failed');
        }
      },
    });
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);

    this.http.post('http://localhost:5000/api/auth/citizen/login', this.loginForm.value).subscribe({
      next: (response: any) => {
        localStorage.removeItem('adminToken');
        localStorage.setItem('token', response.token);
        toast.success('Login successful!');
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isLoading.set(false);

        if (err.status === 429) {
          toast.error('Too many login attempts. Please try again later.');
        } else {
          toast.error(err.error?.message || 'Login failed');
        }
      },
    });
  }
}
