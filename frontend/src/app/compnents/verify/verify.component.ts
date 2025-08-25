import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { environment } from '../../../environment/environment';

interface VerifyResponse {
  success: boolean;
  email?: string;
  message: string;
  error?: string;
  loginTime?: string;
  token?: string;
}

@Component({
  selector: 'app-verify',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './verify.component.html',
  styleUrls: ['./verify.component.css'],
})
export class VerifyComponent implements OnInit, OnDestroy {
  isLoading: boolean = true;
  isSuccess: boolean = false;
  email: string = '';
  message: string = '';
  errorType: string = '';
  loginTime: string = '';

  private destroy$ = new Subject<void>();

  constructor(private route: ActivatedRoute, private router: Router, private http: HttpClient) {}

  ngOnInit(): void {
    const token = this.route.snapshot.params['token'];

    if (!token) {
      this.handleError('INVALID_TOKEN', 'Token not found in the link');
      return;
    }

    // Verify the token with the server
    this.verifyToken(token);
  }

  private verifyToken(token: string): void {
    this.http
      .get<VerifyResponse>(`${environment.apiUrl}/verify/${token}`)
      .pipe(takeUntil(this.destroy$)) // Prevent memory leaks
      .subscribe({
        next: (response) => {
          this.isLoading = false;

          if (response.success) {
            this.isSuccess = true;
            this.email = response.email || '';
            this.message = response.message;
            this.loginTime = response.loginTime
              ? new Date(response.loginTime).toLocaleString('he-IL')
              : new Date().toLocaleString('he-IL');

            console.log('✅ Login successful:', this.email);
          } else {
            this.handleError(response.error || 'UNKNOWN_ERROR', response.message);
          }
        },
        error: (error) => {
          this.isLoading = false;
          console.error('❌ Error verifying token:', error);

          if (error.status === 404) {
            this.handleError('INVALID_TOKEN', 'The link is invalid or has expired');
          } else if (error.status === 400) {
            this.handleError(
              error.error?.error || 'BAD_REQUEST',
              error.error?.message || 'Invalid request'
            );
          } else {
            this.handleError('SERVER_ERROR', 'Server error. Please try again later.');
          }
        },
      });
  }

  private handleError(errorType: string, message: string): void {
    this.isSuccess = false;
    this.errorType = errorType;
    this.message = message;
    this.isLoading = false;
  }

  goHome(): void {
    this.router.navigate(['/']);
  }

  requestNewLink(): void {
    this.router.navigate(['/']);
  }

  getClasses() {
    return {
      'fa-check-circle': this.isSuccess,
      'fa-spinner fa-spin': this.isLoading,
      [this.getErrorIcon()]: !this.isSuccess && !this.isLoading,
    };
  }

  getErrorIcon(): string {
    switch (this.errorType) {
      case 'TOKEN_EXPIRED':
        return 'fa-clock';
      case 'TOKEN_ALREADY_USED':
        return 'fa-exclamation-triangle';
      case 'INVALID_TOKEN':
        return 'fa-ban';
      default:
        return 'fa-times-circle';
    }
  }

  getErrorColor(): string {
    switch (this.errorType) {
      case 'TOKEN_EXPIRED':
        return 'text-warning';
      case 'TOKEN_ALREADY_USED':
        return 'text-info';
      case 'INVALID_TOKEN':
        return 'text-danger';
      default:
        return 'text-danger';
    }
  }

  // Cleanup subscriptions to prevent memory leaks
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}