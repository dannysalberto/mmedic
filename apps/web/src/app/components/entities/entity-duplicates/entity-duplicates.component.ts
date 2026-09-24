import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EntitiesService } from '../../../services/entities.service';
import { NotificationService } from '../../../services/notification.service';
import { DuplicateEntityGroup, EntityWithStats } from '@mmedic/types';

@Component({
  selector: 'app-entity-duplicates',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './entity-duplicates.component.html',
  styleUrls: ['./entity-duplicates.component.css'],
})
export class EntityDuplicatesComponent implements OnInit {
  private readonly entitiesService = inject(EntitiesService);
  private readonly notificationService = inject(NotificationService);

  readonly duplicates = this.entitiesService.duplicates;
  readonly isLoading = this.entitiesService.loadingDuplicates;

  readonly selectedGroup = signal<DuplicateEntityGroup | null>(null);
  readonly primaryId = signal<string>('');
  readonly secondaryId = signal<string>('');
  readonly isMerging = signal<boolean>(false);

  ngOnInit(): void {
    this.fetchDuplicates();
  }

  fetchDuplicates(): void {
    this.entitiesService.getDuplicates().subscribe();
  }

  openMergeModal(group: DuplicateEntityGroup): void {
    this.selectedGroup.set(group);
    if (group.entities.length >= 2) {
      // Por defecto la primera como principal y la segunda como secundaria
      this.primaryId.set(group.entities[0].id);
      this.secondaryId.set(group.entities[1].id);
    }
  }

  closeMergeModal(): void {
    this.selectedGroup.set(null);
    this.primaryId.set('');
    this.secondaryId.set('');
    this.isMerging.set(false);
  }

  executeMerge(): void {
    const pId = this.primaryId();
    const sId = this.secondaryId();

    if (!pId || !sId || pId === sId) {
      this.notificationService.error('Error de selección', 'Debe seleccionar una entidad principal y otra secundaria diferentes.');
      return;
    }

    this.isMerging.set(true);
    this.entitiesService.mergeEntities(pId, sId).subscribe({
      next: (res) => {
        this.isMerging.set(false);
        if (res.success) {
          this.notificationService.success(
            'Entidades consolidadas',
            'Se han fusionado los registros y reasignado las participaciones en artículos exitosamente.'
          );
          this.closeMergeModal();
        }
      },
      error: (err) => {
        this.isMerging.set(false);
        const msg = err.error?.message || 'Error al fusionar entidades';
        this.notificationService.error('Error de fusión', msg);
      },
    });
  }
}
