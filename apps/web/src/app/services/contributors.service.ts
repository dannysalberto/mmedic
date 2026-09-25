import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import {
  Contributor,
  ContributorWithStats,
  CreateContributorDto,
  UpdateContributorDto,
  DuplicateContributorGroup,
  ApiResponse,
} from '@mmedic/types';
import { getApiBaseUrl } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ContributorsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${getApiBaseUrl()}/contributors`;

  readonly contributors = signal<ContributorWithStats[]>([]);
  readonly loading = signal<boolean>(false);
  readonly duplicates = signal<DuplicateContributorGroup[]>([]);
  readonly loadingDuplicates = signal<boolean>(false);

  getContributors(search?: string, status?: string): Observable<ApiResponse<ContributorWithStats[]>> {
    let params = new HttpParams();
    if (search?.trim()) {
      params = params.set('search', search.trim());
    }
    if (status && status !== 'all') {
      params = params.set('status', status);
    }

    this.loading.set(true);
    return this.http
      .get<ApiResponse<ContributorWithStats[]>>(this.apiUrl, { params })
      .pipe(
        tap({
          next: (res) => {
            if (res.success && res.data) {
              this.contributors.set(res.data);
            }
            this.loading.set(false);
          },
          error: () => this.loading.set(false),
        })
      );
  }

  getContributorByCode(code: string): Observable<ApiResponse<ContributorWithStats>> {
    const encoded = encodeURIComponent(code.trim());
    return this.http.get<ApiResponse<ContributorWithStats>>(`${this.apiUrl}/by-code/${encoded}`);
  }

  getContributorById(id: string): Observable<ApiResponse<ContributorWithStats>> {
    return this.http.get<ApiResponse<ContributorWithStats>>(`${this.apiUrl}/${id}`);
  }

  createContributor(dto: CreateContributorDto): Observable<ApiResponse<ContributorWithStats>> {
    return this.http
      .post<ApiResponse<ContributorWithStats>>(this.apiUrl, dto)
      .pipe(
        tap((res) => {
          if (res.success && res.data) {
            this.getContributors().subscribe();
          }
        })
      );
  }

  updateContributor(id: string, dto: UpdateContributorDto): Observable<ApiResponse<ContributorWithStats>> {
    return this.http
      .put<ApiResponse<ContributorWithStats>>(`${this.apiUrl}/${id}`, dto)
      .pipe(
        tap((res) => {
          if (res.success && res.data) {
            this.getContributors().subscribe();
          }
        })
      );
  }

  deleteContributor(id: string): Observable<ApiResponse<{ id: string; deleted: boolean }>> {
    return this.http
      .delete<ApiResponse<{ id: string; deleted: boolean }>>(`${this.apiUrl}/${id}`)
      .pipe(
        tap((res) => {
          if (res.success) {
            this.contributors.update((prev) => prev.filter((c) => c.id !== id));
          }
        })
      );
  }

  getDuplicates(): Observable<ApiResponse<DuplicateContributorGroup[]>> {
    this.loadingDuplicates.set(true);
    return this.http
      .get<ApiResponse<DuplicateContributorGroup[]>>(`${this.apiUrl}/duplicates`)
      .pipe(
        tap({
          next: (res) => {
            if (res.success && res.data) {
              this.duplicates.set(res.data);
            }
            this.loadingDuplicates.set(false);
          },
          error: () => this.loadingDuplicates.set(false),
        })
      );
  }

  mergeContributors(primaryContributorId: string, secondaryContributorId: string): Observable<ApiResponse<ContributorWithStats>> {
    return this.http
      .post<ApiResponse<ContributorWithStats>>(`${this.apiUrl}/merge`, {
        primaryContributorId,
        secondaryContributorId,
      })
      .pipe(
        tap((res) => {
          if (res.success) {
            this.getContributors().subscribe();
            this.getDuplicates().subscribe();
          }
        })
      );
  }
}
