import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ArticlesService } from '../../../services/articles.service';
import { CategoriesService } from '../../../services/categories.service';
import { HeaderComponent } from '../../header/header.component';

@Component({
  selector: 'app-articles-list',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent],
  templateUrl: './articles-list.component.html',
  styleUrls: ['./articles-list.component.css'],
})
export class ArticlesListComponent implements OnInit {
  private readonly articlesService = inject(ArticlesService);
  private readonly categoriesService = inject(CategoriesService);
  private readonly router = inject(Router);

  // Search and filter signals
  readonly searchTerm = signal<string>('');
  readonly selectedCategoryId = signal<string>('');
  readonly selectedStatus = signal<string>('all'); // 'all' | 'active' | 'inactive'

  // Data signals from services
  readonly articles = this.articlesService.articles;
  readonly categories = this.categoriesService.categories;
  readonly isLoading = this.articlesService.loading;

  ngOnInit(): void {
    this.fetchArticles();
    this.categoriesService.loadAll().subscribe();
  }

  fetchArticles(): void {
    const isActive =
      this.selectedStatus() === 'active'
        ? true
        : this.selectedStatus() === 'inactive'
        ? false
        : undefined;

    this.articlesService
      .getArticles(
        this.searchTerm(),
        this.selectedCategoryId() || undefined,
        isActive
      )
      .subscribe();
  }

  onFilterChange(): void {
    this.fetchArticles();
  }

  goToNew(): void {
    this.router.navigate(['/articles/new']);
  }

  goToEdit(id: string): void {
    this.router.navigate(['/articles', id, 'edit']);
  }
}
