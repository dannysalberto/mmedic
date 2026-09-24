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
    path: 'articles',
    loadComponent: () =>
      import(
        './components/articles/articles-list/articles-list.component'
      ).then((m) => m.ArticlesListComponent),
    canActivate: [authGuard],
  },
  {
    path: 'articles/new',
    loadComponent: () =>
      import(
        './components/articles/article-form/article-form.component'
      ).then((m) => m.ArticleFormComponent),
    canActivate: [authGuard],
  },
  {
    path: 'articles/:id/edit',
    loadComponent: () =>
      import(
        './components/articles/article-form/article-form.component'
      ).then((m) => m.ArticleFormComponent),
    canActivate: [authGuard],
  },
  {
    path: 'entities',
    loadComponent: () =>
      import(
        './components/entities/entities-list/entities-list.component'
      ).then((m) => m.EntitiesListComponent),
    canActivate: [authGuard],
  },
  {
    path: 'contributors',
    loadComponent: () =>
      import(
        './components/contributors/contributors-list/contributors-list.component'
      ).then((m) => m.ContributorsListComponent),
    canActivate: [authGuard],
  },
  {
    path: 'categories',
    loadComponent: () =>
      import(
        './components/categories/categories-list/categories-list.component'
      ).then((m) => m.CategoriesListComponent),
    canActivate: [authGuard],
  },
  {
    path: 'customers',
    loadComponent: () =>
      import(
        './components/customers/customers-list/customers-list.component'
      ).then((m) => m.CustomersListComponent),
    canActivate: [authGuard],
  },
  {
    path: 'invoices',
    loadComponent: () =>
      import(
        './components/invoices/invoices-list/invoices-list.component'
      ).then((m) => m.InvoicesListComponent),
    canActivate: [authGuard],
  },
  {
    path: 'invoices/new',
    loadComponent: () =>
      import(
        './components/invoices/invoice-create/invoice-create.component'
      ).then((m) => m.InvoiceCreateComponent),
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
