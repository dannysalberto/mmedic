import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import {
  Article,
  CreateArticleDto,
  UpdateArticleDto,
  ApiResponse,
} from '@mmedic/types';

@Injectable({
  providedIn: 'root',
})
export class ArticlesService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/api/v1/articles';

  readonly articles = signal<Article[]>([]);
  readonly loading = signal<boolean>(false);

  getArticles(
    search?: string,
    categoryId?: string,
    isActive?: boolean
  ): Observable<ApiResponse<Article[]>> {
    let params = new HttpParams();
    if (search?.trim()) {
      params = params.set('search', search.trim());
    }
    if (categoryId) {
      params = params.set('categoryId', categoryId);
    }
    if (typeof isActive === 'boolean') {
      params = params.set('isActive', isActive.toString());
    }

    this.loading.set(true);
    return this.http
      .get<ApiResponse<Article[]>>(this.apiUrl, { params })
      .pipe(
        tap({
          next: (res) => {
            if (res.success && res.data) {
              this.articles.set(res.data);
            }
            this.loading.set(false);
          },
          error: () => this.loading.set(false),
        })
      );
  }

  getArticleById(id: string): Observable<ApiResponse<Article>> {
    return this.http.get<ApiResponse<Article>>(`${this.apiUrl}/${id}`);
  }

  createArticle(dto: CreateArticleDto): Observable<ApiResponse<Article>> {
    return this.http.post<ApiResponse<Article>>(this.apiUrl, dto).pipe(
      tap((res) => {
        if (res.success && res.data) {
          this.articles.update((prev) => [res.data, ...prev]);
        }
      })
    );
  }

  updateArticle(
    id: string,
    dto: UpdateArticleDto
  ): Observable<ApiResponse<Article>> {
    return this.http.put<ApiResponse<Article>>(`${this.apiUrl}/${id}`, dto).pipe(
      tap((res) => {
        if (res.success && res.data) {
          this.articles.update((prev) =>
            prev.map((a) => (a.id === id ? res.data : a))
          );
        }
      })
    );
  }
}
