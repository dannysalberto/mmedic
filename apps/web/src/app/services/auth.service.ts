import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { User, LoginDto, LoginResponseData, ApiResponse } from '@mmedic/types';
import { getApiBaseUrl } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly apiUrl = `${getApiBaseUrl()}/auth`;

  // Signals reactivos (Constitución 4.1)
  readonly currentUser = signal<User | null>(this.getStoredUser());
  readonly token = signal<string | null>(localStorage.getItem('mmedic_token'));
  readonly permissions = signal<string[]>(this.getStoredPermissions());

  readonly isAuthenticated = computed(() => !!this.token());
  readonly isSuperAdmin = computed(() => this.currentUser()?.role === 'ROL_SUPERADMIN');
  readonly isAdmin = computed(() => this.currentUser()?.role === 'ROL_ADMIN' || this.currentUser()?.role === 'ROL_SUPERADMIN');

  login(credentials: LoginDto): Observable<ApiResponse<LoginResponseData>> {
    return this.http.post<ApiResponse<LoginResponseData>>(`${this.apiUrl}/login`, credentials).pipe(
      tap((response) => {
        if (response.success && response.data) {
          const { accessToken, user, permissions } = response.data;
          this.token.set(accessToken);
          this.currentUser.set(user);
          this.permissions.set(permissions);

          localStorage.setItem('mmedic_token', accessToken);
          localStorage.setItem('mmedic_user', JSON.stringify(user));
          localStorage.setItem('mmedic_permissions', JSON.stringify(permissions));
        }
      })
    );
  }

  logout() {
    this.token.set(null);
    this.currentUser.set(null);
    this.permissions.set([]);

    localStorage.removeItem('mmedic_token');
    localStorage.removeItem('mmedic_user');
    localStorage.removeItem('mmedic_permissions');

    this.router.navigate(['/login']);
  }

  hasPermission(permissionCode: string): boolean {
    if (this.isSuperAdmin()) return true;
    const perms = this.permissions();
    return perms.includes('*') || perms.includes(permissionCode);
  }

  private getStoredUser(): User | null {
    try {
      const stored = localStorage.getItem('mmedic_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  private getStoredPermissions(): string[] {
    try {
      const stored = localStorage.getItem('mmedic_permissions');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }
}
