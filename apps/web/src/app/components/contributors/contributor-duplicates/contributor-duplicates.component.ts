import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContributorsService } from '../../../services/contributors.service';
import { NotificationService } from '../../../services/notification.service';
import { DuplicateContributorGroup, ContributorWithStats } from '@mmedic/types';

@Component({
  selector: 'app-contributor-duplicates',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contributor-duplicates.component.html',
  styleUrls: ['./contributor-duplicates.component.css'],
})
export class ContributorDuplicatesComponent implements OnInit {
  private readonly contributorsService = inject(ContributorsService);
  private readonly notificationService = inject(NotificationService);

  readonly duplicates = this.contributorsService.duplicates;
  readonly isLoading = this.contributorsService.loadingDuplicates;

  readonly selectedGroup = signal<DuplicateContributorGroup | null>(null);
  readonly primaryId = signal<string>('');
  readonly secondaryId = signal<string>('');
  readonly isMerging = signal<boolean>(false);

  ngOnInit(): void {
    this.fetchDuplicates();
  }

  fetchDuplicates(): void {
    this.contributorsService.getDuplicates().subscribe();
  }

  openMergeModal(group: DuplicateContributorGroup): void {
    this.selectedGroup.set(group);
    if (group.contributors.length >= 2) {
      this.primaryId.set(group.contributors[0].id);
      this.secondaryId.set(group.contributors[1].id);
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
      this.notificationService.error('Error de selección', 'Debe seleccionar un colaborador principal y otro secundario distintos.');
      return;
    }

    this.isMerging.set(true);
    this.contributorsService.mergeContributors(pId, sId).subscribe({
      next: (res) => {
        this.isMerging.set(false);
        if (res.success) {
          this.notificationService.success(
            'Colaboradores consolidados',
            'Se han fusionado los perfiles y consolidado los registros atómicamente.'
          );
          this.closeMergeModal();
        }
      },
      error: (err) => {
        this.isMerging.set(false);
        const msg = err.error?.message || 'Error al fusionar perfiles de colaboradores';
        this.notificationService.error('Error de consolidación', msg);
      },
    });
  }
}
