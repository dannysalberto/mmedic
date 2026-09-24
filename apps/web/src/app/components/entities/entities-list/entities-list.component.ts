import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EntitiesService } from '../../../services/entities.service';
import { NotificationService } from '../../../services/notification.service';
import { EntityFormModalComponent } from '../entity-form-modal/entity-form-modal.component';
import { EntityDuplicatesComponent } from '../entity-duplicates/entity-duplicates.component';
import { HeaderComponent } from '../../header/header.component';
import { EntityWithStats } from '@mmedic/types';

@Component({
  selector: 'app-entities-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HeaderComponent,
    EntityFormModalComponent,
    EntityDuplicatesComponent,
  ],
  templateUrl: './entities-list.component.html',
  styleUrls: ['./entities-list.component.css'],
})
export class EntitiesListComponent implements OnInit {
  private readonly entitiesService = inject(EntitiesService);
  private readonly notificationService = inject(NotificationService);

  // Signals
  readonly activeTab = signal<'list' | 'duplicates'>('list');
  readonly searchTerm = signal<string>('');
  readonly selectedStatus = signal<string>('all');

  readonly entities = this.entitiesService.entities;
  readonly isLoading = this.entitiesService.loading;

  // Modal State
  readonly isFormModalOpen = signal<boolean>(false);
  readonly selectedEntityForEdit = signal<EntityWithStats | null>(null);

  // Safe Delete Modal State
  readonly entityToDelete = signal<EntityWithStats | null>(null);
  readonly isDeleting = signal<boolean>(false);

  ngOnInit(): void {
    this.fetchEntities();
  }

  fetchEntities(): void {
    this.entitiesService
      .getEntities(this.searchTerm(), this.selectedStatus())
      .subscribe();
  }

  onSearchOrFilterChange(): void {
    this.fetchEntities();
  }

  openCreateModal(): void {
    this.selectedEntityForEdit.set(null);
    this.isFormModalOpen.set(true);
  }

  openEditModal(entity: EntityWithStats): void {
    this.selectedEntityForEdit.set(entity);
    this.isFormModalOpen.set(true);
  }

  closeFormModal(): void {
    this.isFormModalOpen.set(false);
    this.selectedEntityForEdit.set(null);
  }

  onEntitySaved(): void {
    this.fetchEntities();
  }

  promptDelete(entity: EntityWithStats): void {
    if (entity.articlesCount > 0) {
      this.notificationService.error(
        'Eliminación bloqueada',
        `No se puede eliminar a "${entity.name}" porque está vinculado a ${entity.articlesCount} artículo(s). Desasócielo previamente o cámbielo a INACTIVO.`
      );
      return;
    }
    this.entityToDelete.set(entity);
  }

  cancelDelete(): void {
    this.entityToDelete.set(null);
    this.isDeleting.set(false);
  }

  confirmDelete(): void {
    const entity = this.entityToDelete();
    if (!entity) return;

    this.isDeleting.set(true);
    this.entitiesService.deleteEntity(entity.id).subscribe({
      next: (res) => {
        this.isDeleting.set(false);
        if (res.success) {
          this.notificationService.success(
            'Entidad eliminada',
            `El colaborador "${entity.name}" ha sido eliminado exitosamente.`
          );
          this.cancelDelete();
        }
      },
      error: (err) => {
        this.isDeleting.set(false);
        const msg = err.error?.message || 'Error al eliminar la entidad';
        this.notificationService.error('Error al eliminar', msg);
        this.cancelDelete();
      },
    });
  }
}
