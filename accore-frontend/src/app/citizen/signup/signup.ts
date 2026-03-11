import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { SocialAuthService, GoogleSigninButtonModule } from '@abacritt/angularx-social-login';

// Spartan UI Imports
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmLabelImports } from '@spartan-ng/helm/label';

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
  ],
  templateUrl: './signup.html',
})
export class Signup implements OnInit {
  private authService = inject(SocialAuthService);
  private http = inject(HttpClient);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  errorMessage = signal<string>('');
  isLoading = signal<boolean>(false);

  signupForm = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  ngOnInit() {
    this.authService.authState.subscribe((user) => {
      if (user && user.idToken) {
        this.handleGoogleSignup(user.idToken);
      }
    });
  }

  handleGoogleSignup(token: string) {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.http.post('http://localhost:5000/api/auth/citizen/google', { token }).subscribe({
      next: (response: any) => {
        localStorage.setItem('token', response.token);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.errorMessage.set('Google signup failed. Please try again.');
        this.isLoading.set(false);
      },
    });
  }

  onSubmit() {
    if (this.signupForm.invalid) {
      this.signupForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    const newCitizen = this.signupForm.value;

    this.http.post('http://localhost:5000/api/auth/citizen/register', newCitizen).subscribe({
      next: (response: any) => {
        if (response.token) {
          localStorage.setItem('token', response.token);
        }
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Registration failed. Please try again.');
        this.isLoading.set(false);
      },
    });
  }
}
