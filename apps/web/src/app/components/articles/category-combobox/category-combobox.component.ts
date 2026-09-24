import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  input,
  output,
  ElementRef,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoriesService } from '../../../services/categories.service';
import { NotificationService } from '../../../services/notification.service';
import { ArticleCategory } from '@mmedic/types';

@Component({
  selector: 'app-category-combobox',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './category-combobox.component.html',
  styleUrls: ['./category-combobox.component.css'],
})
export class CategoryComboboxComponent implements OnInit {
  private readonly categoriesService = inject(CategoriesService);
  private readonly notificationService = inject(NotificationService);
  private readonly elementRef = inject(ElementRef);

  // Inputs & Outputs
  readonly selectedCategoryId = input<string>('');
  readonly categorySelected = output<ArticleCategory>();

  // State Signals
  readonly isOpen = signal<boolean>(false);
  readonly searchTerm = signal<string>('');
  readonly isCreating = signal<boolean>(false);
  readonly errorMessage = signal<string>('');

  // Categories from service
  readonly categories = this.categoriesService.categories;
  readonly isLoading = this.categoriesService.loading;

  // Computed
  readonly selectedCategory = computed(() => {
    const id = this.selectedCategoryId();
    return this.categories().find((c) => c.id === id) || null;
  });

  readonly filteredCategories = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.categories();
    return this.categories().filter((c) =>
      c.name.toLowerCase().includes(term)
    );
  });

  readonly hasExactMatch = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return true;
    return this.categories().some(
      (c) => c.name.toLowerCase().trim() === term
    );
  });

  ngOnInit(): void {
    if (this.categories().length === 0) {
      this.categoriesService.loadAll().subscribe();
    }
  }

  toggleDropdown(): void {
    this.isOpen.update((v) => !v);
    if (this.isOpen()) {
      this.searchTerm.set('');
      this.errorMessage.set('');
    }
  }

  selectCategory(category: ArticleCategory): void {
    this.categorySelected.emit(category);
    this.isOpen.set(false);
    this.searchTerm.set('');
    this.errorMessage.set('');
  }

  createCategory(): void {
    const name = this.searchTerm().trim();
    if (!name || name.length < 2) {
      this.errorMessage.set('El nombre debe tener al menos 2 caracteres');
      return;
    }

    this.isCreating.set(true);
    this.errorMessage.set('');

    this.categoriesService.create({ name }).subscribe({
      next: (res: any) => {
        this.isCreating.set(false);
        if (res.success && res.data) {
          this.notificationService.success(
            'Categoría creada',
            `La categoría '${res.data.name}' se ha creado exitosamente.`
          );
          this.selectCategory(res.data);
        }
      },
      error: (err: any) => {
        this.isCreating.set(false);
        const msg = err.error?.message || 'Error al crear la categoría';
        this.errorMessage.set(msg);
        this.notificationService.error('Error al crear categoría', msg);
      },
    });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen.set(false);
    }
  }
}
