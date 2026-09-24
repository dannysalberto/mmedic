import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContributorsService } from '../../../services/contributors.service';
import { NotificationService } from '../../../services/notification.service';
import { ContributorFormModalComponent } from '../contributor-form-modal/contributor-form-modal.component';
import { ContributorDuplicatesComponent } from '../contributor-duplicates/contributor-duplicates.component';
import { HeaderComponent } from '../../header/header.component';
import { ContributorWithStats } from '@mmedic/types';

@Component({
  selector: 'app-contributors-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HeaderComponent,
    ContributorFormModalComponent,
    ContributorDuplicatesComponent,
  ],
  templateUrl: './contributors-list.component.html',
  styleUrls: ['./contributors-list.component.css'],
})
export class ContributorsListComponent implements OnInit {
  private readonly contributorsService = inject(ContributorsService);
  private readonly notificationService = inject(NotificationService);

  // Signals
  readonly activeTab = signal<'list' | 'duplicates'>('list');
  readonly searchTerm = signal<string>('');
  readonly selectedStatus = signal<string>('all');

  readonly contributors = this.contributorsService.contributors;
  readonly isLoading = this.contributorsService.loading;

  // Modal State
  readonly isFormModalOpen = signal<boolean>(false);
  readonly selectedContributorForEdit = signal<ContributorWithStats | null>(null);

  // Safe Delete Modal State
  readonly contributorToDelete = signal<ContributorWithStats | null>(null);
  readonly isDeleting = signal<boolean>(false);

  ngOnInit(): void {
    this.fetchContributors();
  }

  fetchContributors(): void {
    this.contributorsService
      .getContributors(this.searchTerm(), this.selectedStatus())
      .subscribe();
  }

  onSearchOrFilterChange(): void {
    this.fetchContributors();
  }

  openCreateModal(): void {
    this.selectedContributorForEdit.set(null);
    this.isFormModalOpen.set(true);
  }

  openEditModal(contributor: ContributorWithStats): void {
    this.selectedContributorForEdit.set(contributor);
    this.isFormModalOpen.set(true);
  }

  closeFormModal(): void {
    this.isFormModalOpen.set(false);
    this.selectedContributorForEdit.set(null);
  }

  onContributorSaved(): void {
    this.fetchContributors();
  }

  promptDelete(contributor: ContributorWithStats): void {
    if (contributor.articlesCount > 0) {
      this.notificationService.error(
        'Eliminación bloqueada',
        `No se puede eliminar a "${contributor.name}" porque está vinculado a ${contributor.articlesCount} registro(s). Desasócielo previamente o cámbielo a INACTIVO.`
      );
      return;
    }
    this.contributorToDelete.set(contributor);
  }

  cancelDelete(): void {
    this.contributorToDelete.set(null);
    this.isDeleting.set(false);
  }

  confirmDelete(): void {
    const contributor = this.contributorToDelete();
    if (!contributor) return;

    this.isDeleting.set(true);
    this.contributorsService.deleteContributor(contributor.id).subscribe({
      next: (res) => {
        this.isDeleting.set(false);
        if (res.success) {
          this.notificationService.success(
            'Colaborador eliminado',
            `El profesional "${contributor.name}" ha sido eliminado exitosamente.`
          );
          this.cancelDelete();
        }
      },
      error: (err) => {
        this.isDeleting.set(false);
        const msg = err.error?.message || 'Error al eliminar el colaborador';
        this.notificationService.error('Error al eliminar', msg);
        this.cancelDelete();
      },
    });
  }
}
