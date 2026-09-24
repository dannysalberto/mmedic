import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CategoriesService } from '../../../services/categories.service';
import { NotificationService } from '../../../services/notification.service';
import { DuplicateCategoryGroup, CategoryWithStats } from '@mmedic/types';

@Component({
  selector: 'app-category-duplicates',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './category-duplicates.component.html',
  styleUrls: ['./category-duplicates.component.css'],
})
export class CategoryDuplicatesComponent implements OnInit {
  protected readonly categoriesService = inject(CategoriesService);
  private readonly notificationService = inject(NotificationService);

  readonly duplicates = this.categoriesService.duplicates;
  readonly isLoading = this.categoriesService.loadingDuplicates;

  readonly selectedGroup = signal<DuplicateCategoryGroup | null>(null);
  readonly primaryId = signal<string>('');
  readonly secondaryId = signal<string>('');
  readonly isMerging = signal<boolean>(false);

  ngOnInit(): void {
    this.categoriesService.loadDuplicates().subscribe();
  }

  openMergeModal(group: DuplicateCategoryGroup): void {
    this.selectedGroup.set(group);
    if (group.categories.length >= 2) {
      this.primaryId.set(group.categories[0].id);
      this.secondaryId.set(group.categories[1].id);
    }
  }

  closeMergeModal(): void {
    this.selectedGroup.set(null);
    this.primaryId.set('');
    this.secondaryId.set('');
    this.isMerging.set(false);
  }

  setPrimary(id: string): void {
    const group = this.selectedGroup();
    if (!group) return;
    this.primaryId.set(id);
    // Auto-assign secondary to the other candidate
    const other = group.categories.find((c) => c.id !== id);
    if (other) this.secondaryId.set(other.id);
  }

  executeMerge(): void {
    const pId = this.primaryId();
    const sId = this.secondaryId();

    if (!pId || !sId || pId === sId) {
      this.notificationService.error(
        'Error de selección',
        'Debe seleccionar una categoría principal y otra secundaria diferentes.',
      );
      return;
    }

    this.isMerging.set(true);
    this.categoriesService.merge({ primaryCategoryId: pId, secondaryCategoryId: sId }).subscribe({
      next: (res) => {
        this.isMerging.set(false);
        if (res.success) {
          this.notificationService.success(
            'Categorías consolidadas',
            'Se han fusionado los registros y reasignado todos los artículos exitosamente.',
          );
          this.closeMergeModal();
        }
      },
      error: (err) => {
        this.isMerging.set(false);
        const msg = err.error?.message || 'Error al fusionar categorías';
        this.notificationService.error('Error de fusión', msg);
      },
    });
  }
}
