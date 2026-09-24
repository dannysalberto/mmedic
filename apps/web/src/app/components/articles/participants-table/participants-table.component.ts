import { Component, inject, signal, computed, model } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EntitiesService } from '../../../services/entities.service';
import { EntityModalComponent } from '../entity-modal/entity-modal.component';
import { Entity } from '@mmedic/types';

export interface ParticipantRow {
  entityId: string;
  code: string;
  name: string;
  status: string;
  percentage: number;
  isSearching?: boolean;
  searchError?: string;
}

@Component({
  selector: 'app-participants-table',
  standalone: true,
  imports: [CommonModule, FormsModule, EntityModalComponent],
  templateUrl: './participants-table.component.html',
  styleUrls: ['./participants-table.component.css'],
})
export class ParticipantsTableComponent {
  private readonly entitiesService = inject(EntitiesService);

  readonly rows = model<ParticipantRow[]>([]);
  readonly isModalOpen = signal<boolean>(false);

  // Computeds
  readonly totalPercentage = computed(() => {
    const list = this.rows();
    const sum = list.reduce((acc, r) => acc + (Number(r.percentage) || 0), 0);
    return Math.round(sum * 100) / 100;
  });

  readonly remainingPercentage = computed(() => {
    const rem = 100 - this.totalPercentage();
    return Math.round(rem * 100) / 100;
  });

  readonly isExcess = computed(() => this.totalPercentage() > 100);

  addRow(): void {
    const current = this.rows();
    this.rows.set([
      ...current,
      {
        entityId: '',
        code: '',
        name: '',
        status: '',
        percentage: 0,
      },
    ]);
  }

  removeRow(index: number): void {
    const current = [...this.rows()];
    current.splice(index, 1);
    this.rows.set(current);
  }

  onCodeBlur(row: ParticipantRow): void {
    const code = row.code?.trim();
    if (!code) {
      row.entityId = '';
      row.name = '';
      row.status = '';
      row.searchError = '';
      return;
    }

    row.isSearching = true;
    row.searchError = '';

    this.entitiesService.getEntityByCode(code).subscribe({
      next: (res) => {
        row.isSearching = false;
        if (res.success && res.data) {
          // Validar que no esté duplicado en otra fila
          const isDuplicate = this.rows().some(
            (r) => r !== row && r.entityId === res.data.id
          );
          if (isDuplicate) {
            row.searchError = 'Esta entidad ya fue agregada al artículo';
            row.entityId = '';
            row.name = '';
            row.status = '';
            return;
          }

          row.entityId = res.data.id;
          row.code = res.data.code;
          row.name = res.data.name;
          row.status = res.data.status;
          row.searchError = '';
        }
      },
      error: () => {
        row.isSearching = false;
        row.entityId = '';
        row.name = '';
        row.status = '';
        row.searchError = 'Código no encontrado. Regístralo con "+ Nueva Entidad".';
      },
    });
  }

  openNewEntityModal(): void {
    this.isModalOpen.set(true);
  }

  closeNewEntityModal(): void {
    this.isModalOpen.set(false);
  }

  onEntityCreated(entity: Entity): void {
    // Si la última fila está vacía, la llenamos; si no, añadimos nueva fila
    const current = [...this.rows()];
    const last = current[current.length - 1];

    if (last && !last.entityId && !last.code) {
      last.entityId = entity.id;
      last.code = entity.code;
      last.name = entity.name;
      last.status = entity.status;
      last.searchError = '';
      this.rows.set(current);
    } else {
      this.rows.set([
        ...current,
        {
          entityId: entity.id,
          code: entity.code,
          name: entity.name,
          status: entity.status,
          percentage: 0,
        },
      ]);
    }
  }
}
