import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { UsersListComponent } from './components/users/users-list.component';
import { InvoiceActionsDemoComponent } from './components/billing-demo/invoice-actions-demo.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'users',
    component: UsersListComponent,
    canActivate: [authGuard],
  },
  {
    path: 'billing-demo',
    component: InvoiceActionsDemoComponent,
    canActivate: [authGuard],
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];
