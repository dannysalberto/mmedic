import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { UserFormModalComponent } from './user-form-modal.component';
import { UserPermissionsModalComponent } from './user-permissions-modal.component';
import { UsersService } from '../../services/users.service';
import { AuthService } from '../../services/auth.service';
import { User, UserRole } from '@mmedic/types';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    HeaderComponent,
    UserFormModalComponent,
    UserPermissionsModalComponent,
  ],
  templateUrl: './users-list.component.html',
  styleUrls: ['./users-list.component.css'],
})
export class UsersListComponent implements OnInit {
  private readonly usersService = inject(UsersService);
  readonly authService = inject(AuthService);

  readonly users = signal<(User & { specialPermissionsCount?: number })[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly limit = signal(10);
  readonly searchQuery = signal('');
  readonly selectedRole = signal<UserRole | ''>('');
  readonly isLoading = signal(false);
  readonly feedbackMessage = signal<string | null>(null);

  readonly isFormModalOpen = signal(false);
  readonly selectedUserForEdit = signal<User | null>(null);

  readonly isPermissionsModalOpen = signal(false);
  readonly selectedUserForPermissions = signal<User | null>(null);

  readonly roles: { value: UserRole | ''; label: string }[] = [
    { value: '', label: 'Todos los Roles' },
    { value: 'ROL_SUPERADMIN', label: 'Super Administrador' },
    { value: 'ROL_ADMIN', label: 'Administrador' },
    { value: 'ROL_MEDICO', label: 'Médico' },
    { value: 'ROL_CAJERO', label: 'Cajero' },
    { value: 'ROL_GERENCIA', label: 'Gerencia' },
  ];

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.isLoading.set(true);
    this.usersService
      .getUsers(this.page(), this.limit(), this.searchQuery(), this.selectedRole())
      .subscribe({
        next: (res) => {
          this.isLoading.set(false);
          if (res.data) {
            this.users.set(res.data.items);
            this.total.set(res.data.total);
          }
        },
        error: (err) => {
          this.isLoading.set(false);
          this.showFeedback('Error al cargar la lista de usuarios');
        },
      });
  }

  onSearch(query: string) {
    this.searchQuery.set(query);
    this.page.set(1);
    this.loadUsers();
  }

  onRoleFilter(role: any) {
    this.selectedRole.set(role);
    this.page.set(1);
    this.loadUsers();
  }

  openCreateModal() {
    this.selectedUserForEdit.set(null);
    this.isFormModalOpen.set(true);
  }

  openEditModal(user: User) {
    this.selectedUserForEdit.set(user);
    this.isFormModalOpen.set(true);
  }

  closeFormModal() {
    this.isFormModalOpen.set(false);
    this.selectedUserForEdit.set(null);
  }

  onUserSaved(user: User) {
    this.closeFormModal();
    this.showFeedback(`Usuario ${user.fullName} guardado exitosamente`);
    this.loadUsers();
  }

  openPermissionsModal(user: User) {
    this.selectedUserForPermissions.set(user);
    this.isPermissionsModalOpen.set(true);
  }

  closePermissionsModal() {
    this.isPermissionsModalOpen.set(false);
    this.selectedUserForPermissions.set(null);
    this.loadUsers();
  }

  toggleStatus(user: User) {
    const nextStatus = !user.isActive;
    this.usersService.updateStatus(user.id, nextStatus).subscribe({
      next: () => {
        this.showFeedback(`Estado del usuario ${user.username} actualizado`);
        this.loadUsers();
      },
      error: () => {
        this.showFeedback('Error al cambiar el estado del usuario');
      },
    });
  }

  showFeedback(msg: string) {
    this.feedbackMessage.set(msg);
    setTimeout(() => {
      this.feedbackMessage.set(null);
    }, 4000);
  }
}
