import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoriesService } from '../../../services/categories.service';
import { NotificationService } from '../../../services/notification.service';
import { CategoryFormModalComponent } from '../category-form-modal/category-form-modal.component';
import { CategoryDuplicatesComponent } from '../category-duplicates/category-duplicates.component';
import { HeaderComponent } from '../../header/header.component';
import { CategoryWithStats } from '@mmedic/types';

@Component({
  selector: 'app-categories-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HeaderComponent,
    CategoryFormModalComponent,
    CategoryDuplicatesComponent,
  ],
  templateUrl: './categories-list.component.html',
  styleUrls: ['./categories-list.component.css'],
})
export class CategoriesListComponent implements OnInit {
  private readonly categoriesService = inject(CategoriesService);
  private readonly notificationService = inject(NotificationService);

  readonly activeTab = signal<'list' | 'duplicates'>('list');
  readonly categories = this.categoriesService.filteredCategories;
  readonly isLoading = this.categoriesService.loading;

  readonly isFormModalOpen = signal<boolean>(false);
  readonly selectedCategoryForEdit = signal<CategoryWithStats | null>(null);

  readonly categoryToDelete = signal<CategoryWithStats | null>(null);
  readonly isDeleting = signal<boolean>(false);

  ngOnInit(): void {
    this.categoriesService.loadAll().subscribe();
  }

  onSearch(term: string): void {
    this.categoriesService.searchTerm.set(term);
  }

  openCreateModal(): void {
    this.selectedCategoryForEdit.set(null);
    this.isFormModalOpen.set(true);
  }

  openEditModal(category: CategoryWithStats): void {
    this.selectedCategoryForEdit.set(category);
    this.isFormModalOpen.set(true);
  }

  closeFormModal(): void {
    this.isFormModalOpen.set(false);
    this.selectedCategoryForEdit.set(null);
  }

  onCategorySaved(): void {
    this.categoriesService.loadAll().subscribe();
  }

  promptDelete(category: CategoryWithStats): void {
    if (category.articlesCount > 0) {
      this.notificationService.error(
        'Eliminación bloqueada',
        `No se puede eliminar la categoría "${category.name}" porque está vinculada a ${category.articlesCount} artículo(s). Reasigne o desasocie los artículos previamente.`,
      );
      return;
    }
    this.categoryToDelete.set(category);
  }

  cancelDelete(): void {
    this.categoryToDelete.set(null);
    this.isDeleting.set(false);
  }

  confirmDelete(): void {
    const category = this.categoryToDelete();
    if (!category) return;
    this.isDeleting.set(true);
    this.categoriesService.delete(category.id).subscribe({
      next: (res) => {
        this.isDeleting.set(false);
        if (res.success) {
          this.notificationService.success(
            'Categoría eliminada',
            `La categoría "${category.name}" ha sido eliminada exitosamente.`,
          );
          this.cancelDelete();
        }
      },
      error: (err) => {
        this.isDeleting.set(false);
        const msg = err.error?.message || 'Error al eliminar la categoría';
        this.notificationService.error('Error al eliminar', msg);
        this.cancelDelete();
      },
    });
  }
}
