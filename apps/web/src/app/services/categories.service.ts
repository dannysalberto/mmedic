import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import {
  CategoryWithStats,
  DuplicateCategoryGroup,
  MergeCategoriesDto,
  UpdateCategoryDto,
  CreateCategoryDto,
  ApiResponse,
} from '@mmedic/types';

@Injectable({
  providedIn: 'root',
})
export class CategoriesService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/api/v1/article-categories';

  readonly categories = signal<CategoryWithStats[]>([]);
  readonly loading = signal<boolean>(false);
  readonly duplicates = signal<DuplicateCategoryGroup[]>([]);
  readonly loadingDuplicates = signal<boolean>(false);

  // T012: Client-side search via computed()
  searchTerm = signal<string>('');
  readonly filteredCategories = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.categories();
    return this.categories().filter((c) => c.name.toLowerCase().includes(term));
  });

  // T012: loadAll
  loadAll(): Observable<ApiResponse<CategoryWithStats[]>> {
    this.loading.set(true);
    return this.http.get<ApiResponse<CategoryWithStats[]>>(this.apiUrl).pipe(
      tap({
        next: (res) => {
          if (res.success && res.data) this.categories.set(res.data);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      }),
    );
  }

  // T025: create
  create(dto: CreateCategoryDto): Observable<ApiResponse<CategoryWithStats>> {
    return this.http.post<ApiResponse<CategoryWithStats>>(this.apiUrl, dto).pipe(
      tap((res) => {
        if (res.success && res.data) this.loadAll().subscribe();
      }),
    );
  }

  // T025: update
  update(id: string, dto: UpdateCategoryDto): Observable<ApiResponse<CategoryWithStats>> {
    return this.http.put<ApiResponse<CategoryWithStats>>(`${this.apiUrl}/${id}`, dto).pipe(
      tap((res) => {
        if (res.success && res.data) this.loadAll().subscribe();
      }),
    );
  }

  // T028: delete
  delete(id: string): Observable<ApiResponse<{ id: string; deleted: boolean }>> {
    return this.http
      .delete<ApiResponse<{ id: string; deleted: boolean }>>(`${this.apiUrl}/${id}`)
      .pipe(
        tap((res) => {
          if (res.success) {
            this.categories.update((prev) => prev.filter((c) => c.id !== id));
          }
        }),
      );
  }

  // T032: loadDuplicates
  loadDuplicates(): Observable<ApiResponse<DuplicateCategoryGroup[]>> {
    this.loadingDuplicates.set(true);
    return this.http.get<ApiResponse<DuplicateCategoryGroup[]>>(`${this.apiUrl}/duplicates`).pipe(
      tap({
        next: (res) => {
          if (res.success && res.data) this.duplicates.set(res.data);
          this.loadingDuplicates.set(false);
        },
        error: () => this.loadingDuplicates.set(false),
      }),
    );
  }

  // T032: merge
  merge(dto: MergeCategoriesDto): Observable<ApiResponse<CategoryWithStats>> {
    return this.http.post<ApiResponse<CategoryWithStats>>(`${this.apiUrl}/merge`, dto).pipe(
      tap((res) => {
        if (res.success) {
          this.loadAll().subscribe();
          this.loadDuplicates().subscribe();
        }
      }),
    );
  }
}
