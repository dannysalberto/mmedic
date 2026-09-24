import { Component, inject, signal, input, output, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CategoriesService } from '../../../services/categories.service';
import { NotificationService } from '../../../services/notification.service';
import { CategoryWithStats } from '@mmedic/types';

@Component({
  selector: 'app-category-form-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './category-form-modal.component.html',
  styleUrls: ['./category-form-modal.component.css'],
})
export class CategoryFormModalComponent {
  private readonly categoriesService = inject(CategoriesService);
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);

  readonly isOpen = input<boolean>(false);
  readonly categoryToEdit = input<CategoryWithStats | null>(null);
  readonly saved = output<void>();
  readonly closeModal = output<void>();

  readonly name = signal<string>('');
  readonly isSubmitting = signal<boolean>(false);
  readonly errorMessage = signal<string>('');

  constructor() {
    effect(() => {
      const category = this.categoryToEdit();
      if (category) {
        this.name.set(category.name);
      } else {
        this.resetForm();
      }
    });
  }

  resetForm(): void {
    this.name.set('');
    this.errorMessage.set('');
    this.isSubmitting.set(false);
  }

  onClose(): void {
    this.resetForm();
    this.closeModal.emit();
  }

  onSubmit(): void {
    const nameVal = this.name().trim();
    if (!nameVal) {
      this.errorMessage.set('El nombre de la categoría es obligatorio');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    const isEdit = !!this.categoryToEdit();

    const request$ = isEdit
      ? this.categoriesService.update(this.categoryToEdit()!.id, { name: nameVal })
      : this.categoriesService.create({ name: nameVal });

    request$.subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        if (res.success) {
          if (isEdit) {
            // Constitution §5.4 — UPDATE: stay on screen
            this.notificationService.success(
              'Categoría actualizada',
              `La categoría "${nameVal}" se ha actualizado correctamente.`,
            );
            this.saved.emit();
          } else {
            // Constitution §5.4 — CREATE: redirect to list
            this.notificationService.success(
              'Categoría creada',
              `La nueva categoría "${nameVal}" ha sido registrada.`,
            );
            this.saved.emit();
            this.onClose();
          }
        }
      },
      error: (err) => {
        this.isSubmitting.set(false);
        const msg = err.error?.message || 'Error al guardar la categoría';
        this.errorMessage.set(msg);
        this.notificationService.error('Error al guardar', msg);
      },
    });
  }
}
