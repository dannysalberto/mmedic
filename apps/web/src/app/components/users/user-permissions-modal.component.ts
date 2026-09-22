import { Component, EventEmitter, Input, OnInit, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SpecialPermission, User } from '@mmedic/types';
import { PermissionsService } from '../../services/permissions.service';

@Component({
  selector: 'app-user-permissions-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-permissions-modal.component.html',
  styleUrls: ['./user-permissions-modal.component.css'],
})
export class UserPermissionsModalComponent implements OnInit {
  @Input({ required: true }) user!: User;
  @Output() close = new EventEmitter<void>();
  @Output() changed = new EventEmitter<void>();

  private readonly permissionsService = inject(PermissionsService);

  readonly catalog = signal<SpecialPermission[]>([]);
  readonly userPermissionCodes = signal<Set<string>>(new Set());
  readonly isLoading = signal(true);
  readonly isSaving = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.permissionsService.getCatalog().subscribe({
      next: (catRes) => {
        this.catalog.set(catRes.data || []);
        this.permissionsService.getUserPermissions(this.user.id).subscribe({
          next: (userRes) => {
            const codes = new Set((userRes.data || []).map((p) => p.code));
            this.userPermissionCodes.set(codes);
            this.isLoading.set(false);
          },
          error: (err) => {
            this.isLoading.set(false);
            this.errorMessage.set(err?.error?.message || 'Error al cargar permisos del usuario');
          },
        });
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err?.error?.message || 'Error al cargar catálogo de permisos');
      },
    });
  }

  hasPermission(code: string): boolean {
    if (this.user.role === 'ROL_SUPERADMIN') return true;
    return this.userPermissionCodes().has(code);
  }

  togglePermission(perm: SpecialPermission) {
    if (this.user.role === 'ROL_SUPERADMIN') return;

    this.isSaving.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const isAssigned = this.userPermissionCodes().has(perm.code);

    if (isAssigned) {
      this.permissionsService.revokePermission(this.user.id, perm.code).subscribe({
        next: () => {
          this.isSaving.set(false);
          const updated = new Set(this.userPermissionCodes());
          updated.delete(perm.code);
          this.userPermissionCodes.set(updated);
          this.successMessage.set(`Permiso "${perm.name}" revocado exitosamente`);
          this.changed.emit();
        },
        error: (err) => {
          this.isSaving.set(false);
          this.errorMessage.set(err?.error?.message || 'Error al revocar permiso');
        },
      });
    } else {
      this.permissionsService.assignPermission(this.user.id, perm.code).subscribe({
        next: () => {
          this.isSaving.set(false);
          const updated = new Set(this.userPermissionCodes());
          updated.add(perm.code);
          this.userPermissionCodes.set(updated);
          this.successMessage.set(`Permiso "${perm.name}" asignado exitosamente`);
          this.changed.emit();
        },
        error: (err) => {
          this.isSaving.set(false);
          this.errorMessage.set(err?.error?.message || 'Error al asignar permiso');
        },
      });
    }
  }
}
