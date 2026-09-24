import {
  Component,
  inject,
  signal,
  input,
  output,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EntitiesService } from '../../../services/entities.service';
import { NotificationService } from '../../../services/notification.service';
import { Entity, EntityStatus } from '@mmedic/types';

@Component({
  selector: 'app-entity-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './entity-modal.component.html',
  styleUrls: ['./entity-modal.component.css'],
})
export class EntityModalComponent {
  private readonly entitiesService = inject(EntitiesService);
  private readonly notificationService = inject(NotificationService);

  readonly isOpen = input<boolean>(false);
  readonly entityCreated = output<Entity>();
  readonly closeModal = output<void>();

  readonly code = signal<string>('');
  readonly name = signal<string>('');
  readonly status = signal<EntityStatus>('ACTIVE');
  readonly isSubmitting = signal<boolean>(false);
  readonly errorMessage = signal<string>('');

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

    this.entitiesService
      .createEntity({
        code: codeVal,
        name: nameVal,
        status: this.status(),
      })
      .subscribe({
        next: (res) => {
          this.isSubmitting.set(false);
          if (res.success && res.data) {
            this.notificationService.success(
              'Médico registrado',
              `El participante '${res.data.name}' se ha registrado exitosamente.`
            );
            this.entityCreated.emit(res.data);
            this.onClose();
          }
        },
        error: (err) => {
          this.isSubmitting.set(false);
          const msg =
            err.error?.message || 'Error al registrar la entidad participante';
          this.errorMessage.set(msg);
          this.notificationService.error('Error al registrar entidad', msg);
        },
      });
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isOpen()) {
      this.onClose();
    }
  }
}
