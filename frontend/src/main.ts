import { bootstrapApplication } from '@angular/platform-browser';
import { importProvidersFrom } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';

import { AppComponent } from './app/app.component';
import { HomeComponent } from './app/compnents/home/home.component';
import { VerifyComponent } from './app/compnents/verify/verify.component';

// הגדרת הroutes ישירות כאן
const routes = [
  { path: '', component: HomeComponent },
  { path: 'verify/:token', component: VerifyComponent }, 
  { path: '**', redirectTo: '' }
];

bootstrapApplication(AppComponent, {
  providers: [
    // ייבוא providers נדרשים
    importProvidersFrom(
      HttpClientModule,
      RouterModule.forRoot(routes)
    )
  ]
}).catch(err => console.error(err));