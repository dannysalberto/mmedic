import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SpecialPermission, CheckPermissionResponseData, ApiResponse } from '@mmedic/types';
import { getApiBaseUrl } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class PermissionsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${getApiBaseUrl()}/permissions`;

  getCatalog(): Observable<ApiResponse<SpecialPermission[]>> {
    return this.http.get<ApiResponse<SpecialPermission[]>>(this.apiUrl);
  }

  getUserPermissions(userId: string): Observable<ApiResponse<SpecialPermission[]>> {
    return this.http.get<ApiResponse<SpecialPermission[]>>(`${this.apiUrl}/user/${userId}`);
  }

  assignPermission(userId: string, permissionCode: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/user/${userId}`, {
      permissionCode,
    });
  }

  revokePermission(userId: string, permissionCode: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/user/${userId}/${permissionCode}`);
  }

  checkPermission(userId: string, permission: string): Observable<ApiResponse<CheckPermissionResponseData>> {
    return this.http.post<ApiResponse<CheckPermissionResponseData>>(`${this.apiUrl}/check`, {
      userId,
      permission,
    });
  }
}
