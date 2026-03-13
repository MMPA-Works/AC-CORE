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
  selector: 'app-signup',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    GoogleSigninButtonModule,
    HlmButtonImports,
    HlmInputImports,
    HlmLabelImports,
    HlmToasterImports
  ],
  templateUrl: './signup.html',
})
export class Signup implements OnInit {
  private authService = inject(SocialAuthService);
  private http = inject(HttpClient);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  isLoading = signal(false);

  signupForm = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  ngOnInit() {
    this.authService.authState.subscribe((user) => {
      if (user && user.idToken) this.handleGoogleSignup(user.idToken);
    });
  }

  handleGoogleSignup(token: string) {
    this.isLoading.set(true);

    this.http.post('http://localhost:5000/api/auth/citizen/google', { token }).subscribe({
      next: (response: any) => {
        localStorage.setItem('token', response.token);
        toast.success('Signup successful!', { description: 'Redirecting to dashboard...' });
        this.router.navigate(['/dashboard']);
      },
      error: () => {
        this.isLoading.set(false);
        toast.error('Google signup failed', { description: 'Please try again.' });
      },
    });
  }

  onSubmit() {
    if (this.signupForm.invalid) {
      this.signupForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);

    this.http.post('http://localhost:5000/api/auth/citizen/register', this.signupForm.value).subscribe({
      next: (response: any) => {
        localStorage.setItem('token', response.token);
        toast.success('Account created!', { description: 'Redirecting to dashboard...' });
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isLoading.set(false);
        toast.error('Signup failed', { description: err.error?.message || 'Please try again.' });
      },
    });
  }
}