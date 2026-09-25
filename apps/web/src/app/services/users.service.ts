import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User, CreateUserDto, UpdateUserDto, ApiResponse, UserRole } from '@mmedic/types';
import { getApiBaseUrl } from '../../environments/environment';

export interface PaginatedUsersResponse {
  items: (User & { specialPermissionsCount?: number })[];
  total: number;
  page: number;
  limit: number;
}

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${getApiBaseUrl()}/users`;

  getUsers(
    page = 1,
    limit = 10,
    search = '',
    role?: UserRole | ''
  ): Observable<ApiResponse<PaginatedUsersResponse>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (search && search.trim()) {
      params = params.set('search', search.trim());
    }

    if (role) {
      params = params.set('role', role);
    }

    return this.http.get<ApiResponse<PaginatedUsersResponse>>(this.apiUrl, { params });
  }

  getUserById(id: string): Observable<ApiResponse<User>> {
    return this.http.get<ApiResponse<User>>(`${this.apiUrl}/${id}`);
  }

  createUser(dto: CreateUserDto): Observable<ApiResponse<User>> {
    return this.http.post<ApiResponse<User>>(this.apiUrl, dto);
  }

  updateUser(id: string, dto: UpdateUserDto): Observable<ApiResponse<User>> {
    return this.http.put<ApiResponse<User>>(`${this.apiUrl}/${id}`, dto);
  }

  updateStatus(id: string, isActive: boolean): Observable<ApiResponse<User>> {
    return this.http.patch<ApiResponse<User>>(`${this.apiUrl}/${id}/status`, { isActive });
  }
}
