import { Component, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { environment } from '../../../environment/environment.production';

interface ApiResponse {
  message: string;
  showLinkInFrontend?: boolean;
  debugInfo?: {
    token: string;
    link: string;
    sentViaEmail?: boolean;
    method?: string;
  };
  error?: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnDestroy {
  emailForm: FormGroup;
  isLoading: boolean = false;
  message: string = '';
  messageType: 'success' | 'error' | '' = '';
  showLinkInFrontend: boolean = false;
  frontendLink: string = '';

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private http: HttpClient
  ) {
    this.emailForm = this.fb.group({
      email: ['', [
        Validators.required,
        Validators.email
      ]]
    });
  }

  get email() { 
    return this.emailForm.get('email'); 
  }

  onSubmit() {
    if (this.emailForm.invalid) {
      this.markAllFieldsAsTouched();
      return;
    }

    this.isLoading = true;
    this.clearMessage();

    const emailValue = this.email?.value;

    this.http.post<ApiResponse>(`${environment.apiUrl}/send-link`, { 
      email: emailValue 
    })
    .pipe(takeUntil(this.destroy$)) // prevent memory leaks
    .subscribe({
      next: (response) => {
        this.isLoading = false;
        this.showMessage(response.message, 'success');
        
        // if email failed, show the link in the frontend
        if (response.showLinkInFrontend && response.debugInfo?.link) {
          this.showLinkInFrontend = true;
          this.frontendLink = response.debugInfo.link;
        }
        
        this.emailForm.reset();
      },
      error: (error) => {
        this.isLoading = false;
        const errorMessage = error.error?.error || 'Error sending email. Please try again.';
        this.showMessage(errorMessage, 'error');
        console.error('Error sending magic link:', error);
      }
    });
  }

  private showMessage(message: string, type: 'success' | 'error') {
    this.message = message;
    this.messageType = type;
    
    // hide message after 5 seconds
    setTimeout(() => {
      this.clearMessage();
    }, 5000);
  }

  private clearMessage() {
    this.message = '';
    this.messageType = '';
  }

  private markAllFieldsAsTouched() {
    Object.keys(this.emailForm.controls).forEach(key => {
      this.emailForm.get(key)?.markAsTouched();
    });
  }

  // helper functions for template
  isFieldInvalid(fieldName: string): boolean {
    const field = this.emailForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getFieldError(fieldName: string): string {
    const field = this.emailForm.get(fieldName);
    if (field && field.errors && field.touched) {
      if (field.errors['required']) {
        return 'This field is required';
      }
      if (field.errors['email']) {
        return 'Invalid email address';
      }
    }
    return '';
  }

  // frontend link functions
  openFrontendLink() {
    if (this.frontendLink) {
      // safety check before opening the window
      try {
        window.open(this.frontendLink, '_blank');
      } catch (error) {
        console.error('Error opening link:', error);
        window.location.href = this.frontendLink;
      }
    }
  }

  clearFrontendLink() {
    this.showLinkInFrontend = false;
    this.frontendLink = '';
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}