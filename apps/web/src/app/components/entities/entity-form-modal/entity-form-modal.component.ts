import { Component, inject, signal, input, output, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EntitiesService } from '../../../services/entities.service';
import { NotificationService } from '../../../services/notification.service';
import { EntityWithStats, EntityStatus } from '@mmedic/types';

@Component({
  selector: 'app-entity-form-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './entity-form-modal.component.html',
  styleUrls: ['./entity-form-modal.component.css'],
})
export class EntityFormModalComponent {
  private readonly entitiesService = inject(EntitiesService);
  private readonly notificationService = inject(NotificationService);

  readonly isOpen = input<boolean>(false);
  readonly entityToEdit = input<EntityWithStats | null>(null);
  readonly saved = output<void>();
  readonly closeModal = output<void>();

  readonly code = signal<string>('');
  readonly name = signal<string>('');
  readonly status = signal<EntityStatus>('ACTIVE');
  readonly isSubmitting = signal<boolean>(false);
  readonly errorMessage = signal<string>('');

  constructor() {
    effect(() => {
      const entity = this.entityToEdit();
      if (entity) {
        this.code.set(entity.code);
        this.name.set(entity.name);
        this.status.set(entity.status);
      } else {
        this.resetForm();
      }
    });
  }

  resetForm(): void {
    this.code.set('');
    this.name.set('');
    this.status.set('ACTIVE');
    this.errorMessage.set('');
    this.isSubmitting.set(false);
  }

  onClose(): void {
    this.resetForm();
    this.closeModal.emit();
  }

  onSubmit(): void {
    const codeVal = this.code().trim();
    const nameVal = this.name().trim();

    if (!codeVal) {
      this.errorMessage.set('El código de la entidad es obligatorio');
      return;
    }
    if (!nameVal) {
      this.errorMessage.set('El nombre de la entidad es obligatorio');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    const isEdit = !!this.entityToEdit();
    const request$ = isEdit
      ? this.entitiesService.updateEntity(this.entityToEdit()!.id, {
          code: codeVal,
          name: nameVal,
          status: this.status(),
        })
      : this.entitiesService.createEntity({
          code: codeVal,
          name: nameVal,
          status: this.status(),
        });

    request$.subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        if (res.success) {
          if (isEdit) {
            this.notificationService.success(
              'Entidad actualizada',
              `Los datos de "${nameVal}" se han actualizado correctamente.`
            );
            this.saved.emit();
            // Retención en pantalla según Constitución v2.6.0
          } else {
            this.notificationService.success(
              'Entidad registrada',
              `El nuevo colaborador "${nameVal}" ha sido registrado.`
            );
            this.saved.emit();
            this.onClose();
          }
        }
      },
      error: (err) => {
        this.isSubmitting.set(false);
        const msg = err.error?.message || 'Error al guardar la entidad';
        this.errorMessage.set(msg);
        this.notificationService.error('Error al guardar', msg);
      },
    });
  }
}
