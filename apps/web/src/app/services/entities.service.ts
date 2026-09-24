import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import {
  Entity,
  EntityWithStats,
  CreateEntityDto,
  UpdateEntityDto,
  DuplicateEntityGroup,
  ApiResponse,
} from '@mmedic/types';

@Injectable({
  providedIn: 'root',
})
export class EntitiesService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/api/v1/entities';

  readonly entities = signal<EntityWithStats[]>([]);
  readonly loading = signal<boolean>(false);
  readonly duplicates = signal<DuplicateEntityGroup[]>([]);
  readonly loadingDuplicates = signal<boolean>(false);

  getEntities(search?: string, status?: string): Observable<ApiResponse<EntityWithStats[]>> {
    let params = new HttpParams();
    if (search?.trim()) {
      params = params.set('search', search.trim());
    }
    if (status && status !== 'all') {
      params = params.set('status', status);
    }

    this.loading.set(true);
    return this.http
      .get<ApiResponse<EntityWithStats[]>>(this.apiUrl, { params })
      .pipe(
        tap({
          next: (res) => {
            if (res.success && res.data) {
              this.entities.set(res.data);
            }
            this.loading.set(false);
          },
          error: () => this.loading.set(false),
        })
      );
  }

  getEntityByCode(code: string): Observable<ApiResponse<EntityWithStats>> {
    const encoded = encodeURIComponent(code.trim());
    return this.http.get<ApiResponse<EntityWithStats>>(`${this.apiUrl}/by-code/${encoded}`);
  }

  getEntityById(id: string): Observable<ApiResponse<EntityWithStats>> {
    return this.http.get<ApiResponse<EntityWithStats>>(`${this.apiUrl}/${id}`);
  }

  createEntity(dto: CreateEntityDto): Observable<ApiResponse<EntityWithStats>> {
    return this.http
      .post<ApiResponse<EntityWithStats>>(this.apiUrl, dto)
      .pipe(
        tap((res) => {
          if (res.success && res.data) {
            this.getEntities().subscribe();
          }
        })
      );
  }

  updateEntity(id: string, dto: UpdateEntityDto): Observable<ApiResponse<EntityWithStats>> {
    return this.http
      .put<ApiResponse<EntityWithStats>>(`${this.apiUrl}/${id}`, dto)
      .pipe(
        tap((res) => {
          if (res.success && res.data) {
            this.getEntities().subscribe();
          }
        })
      );
  }

  deleteEntity(id: string): Observable<ApiResponse<{ id: string; deleted: boolean }>> {
    return this.http
      .delete<ApiResponse<{ id: string; deleted: boolean }>>(`${this.apiUrl}/${id}`)
      .pipe(
        tap((res) => {
          if (res.success) {
            this.entities.update((prev) => prev.filter((e) => e.id !== id));
          }
        })
      );
  }

  getDuplicates(): Observable<ApiResponse<DuplicateEntityGroup[]>> {
    this.loadingDuplicates.set(true);
    return this.http
      .get<ApiResponse<DuplicateEntityGroup[]>>(`${this.apiUrl}/duplicates`)
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

  mergeEntities(primaryEntityId: string, secondaryEntityId: string): Observable<ApiResponse<EntityWithStats>> {
    return this.http
      .post<ApiResponse<EntityWithStats>>(`${this.apiUrl}/merge`, {
        primaryEntityId,
        secondaryEntityId,
      })
      .pipe(
        tap((res) => {
          if (res.success) {
            this.getEntities().subscribe();
            this.getDuplicates().subscribe();
          }
        })
      );
  }
}
