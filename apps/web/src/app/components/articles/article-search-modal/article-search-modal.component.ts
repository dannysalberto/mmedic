import {
  Component,
  inject,
  signal,
  input,
  output,
  computed,
  HostListener,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ArticlesService } from '../../../services/articles.service';
import { Article } from '@mmedic/types';

@Component({
  selector: 'app-article-search-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './article-search-modal.component.html',
  styleUrls: ['./article-search-modal.component.css'],
})
export class ArticleSearchModalComponent {
  private readonly articlesService = inject(ArticlesService);

  readonly isOpen = input<boolean>(false);
  readonly articleSelected = output<Article>();
  readonly closeModal = output<void>();

  readonly searchTerm = signal<string>('');
  readonly articlesList = signal<Article[]>([]);
  readonly isLoading = signal<boolean>(false);

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        this.searchTerm.set('');
        this.fetchArticles();
      }
    });
  }

  fetchArticles(query?: string): void {
    this.isLoading.set(true);
    this.articlesService.getArticles(query).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.success && res.data) {
          this.articlesList.set(res.data);
        }
      },
      error: () => this.isLoading.set(false),
    });
  }

  onSearchChange(term: string): void {
    this.searchTerm.set(term);
    this.fetchArticles(term);
  }

  onSelect(article: Article): void {
    this.articleSelected.emit(article);
    this.onClose();
  }

  onClose(): void {
    this.closeModal.emit();
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscape(event: KeyboardEvent): void {
    if (this.isOpen()) {
      event.preventDefault();
      this.onClose();
    }
  }
}
