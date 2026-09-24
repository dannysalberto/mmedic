import { Component, OnInit, inject, signal, input, output, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContributorsService } from '../../../services/contributors.service';
import { EntitiesService } from '../../../services/entities.service';
import { NotificationService } from '../../../services/notification.service';
import { ContributorWithStats, ContributorStatus, Entity } from '@mmedic/types';

@Component({
  selector: 'app-contributor-form-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contributor-form-modal.component.html',
  styleUrls: ['./contributor-form-modal.component.css'],
})
export class ContributorFormModalComponent implements OnInit {
  private readonly contributorsService = inject(ContributorsService);
  private readonly entitiesService = inject(EntitiesService);
  private readonly notificationService = inject(NotificationService);

  readonly isOpen = input<boolean>(false);
  readonly contributorToEdit = input<ContributorWithStats | null>(null);
  readonly saved = output<void>();
  readonly closeModal = output<void>();

  readonly availableEntities = signal<Entity[]>([]);
  readonly code = signal<string>('');
  readonly name = signal<string>('');
  readonly entityId = signal<string>('');
  readonly status = signal<ContributorStatus>('ACTIVE');
  readonly isSubmitting = signal<boolean>(false);
  readonly errorMessage = signal<string>('');

  constructor() {
    effect(() => {
      const contributor = this.contributorToEdit();
      if (contributor) {
        this.code.set(contributor.code);
        this.name.set(contributor.name);
        this.entityId.set(contributor.entityId || '');
        this.status.set(contributor.status);
      } else {
        this.resetForm();
      }
    });
  }

  ngOnInit(): void {
    this.entitiesService.getEntities(undefined, 'ACTIVE').subscribe((res) => {
      if (res.success && res.data) {
        this.availableEntities.set(res.data);
      }
    });
  }

  resetForm(): void {
    this.code.set('');
    this.name.set('');
    this.entityId.set('');
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
    const entityIdVal = this.entityId().trim();

    if (!codeVal) {
      this.errorMessage.set('El código del colaborador es obligatorio');
      return;
    }
    if (!nameVal) {
      this.errorMessage.set('El nombre del colaborador es obligatorio');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    const isEdit = !!this.contributorToEdit();
    const dto = {
      code: codeVal,
      name: nameVal,
      status: this.status(),
      entityId: entityIdVal || null,
    };

    const request$ = isEdit
      ? this.contributorsService.updateContributor(this.contributorToEdit()!.id, dto)
      : this.contributorsService.createContributor(dto);

    request$.subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        if (res.success) {
          if (isEdit) {
            this.notificationService.success(
              'Colaborador actualizado',
              `Los datos de "${nameVal}" se han actualizado correctamente.`
            );
            this.saved.emit();
          } else {
            this.notificationService.success(
              'Colaborador registrado',
              `El nuevo colaborador "${nameVal}" ha sido registrado exitosamente.`
            );
            this.saved.emit();
            this.onClose();
          }
        }
      },
      error: (err) => {
        this.isSubmitting.set(false);
        const msg = err.error?.message || 'Error al guardar los datos del colaborador';
        this.errorMessage.set(msg);
        this.notificationService.error('Error al guardar', msg);
      },
    });
  }
}
