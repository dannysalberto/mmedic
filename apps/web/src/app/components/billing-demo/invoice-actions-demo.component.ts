import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { PermissionsService } from '../../services/permissions.service';
import { UsersService } from '../../services/users.service';
import { CheckPermissionResponseData, User } from '@mmedic/types';

@Component({
  selector: 'app-invoice-actions-demo',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HeaderComponent],
  templateUrl: './invoice-actions-demo.component.html',
  styleUrls: ['./invoice-actions-demo.component.css'],
})
export class InvoiceActionsDemoComponent implements OnInit {
  private readonly permissionsService = inject(PermissionsService);
  private readonly usersService = inject(UsersService);

  readonly users = signal<User[]>([]);
  readonly selectedUserId = signal<string>('');
  readonly selectedPermission = signal<string>('FACTURA_ANULAR');

  readonly isChecking = signal(false);
  readonly checkResult = signal<CheckPermissionResponseData | null>(null);
  readonly actionFeedback = signal<string | null>(null);

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.usersService.getUsers(1, 50).subscribe({
      next: (res) => {
        const list = res.data?.items || [];
        this.users.set(list);
        if (list.length > 0) {
          // Seleccionar por defecto un usuario cajero o el primero
          const cajero = list.find((u) => u.role === 'ROL_CAJERO');
          this.selectedUserId.set(cajero ? cajero.id : list[0].id);
          this.verifyPermission();
        }
      },
      error: () => {},
    });
  }

  verifyPermission() {
    const uid = this.selectedUserId();
    const perm = this.selectedPermission();
    if (!uid || !perm) return;

    this.isChecking.set(true);
    this.actionFeedback.set(null);

    this.permissionsService.checkPermission(uid, perm).subscribe({
      next: (res) => {
        this.isChecking.set(false);
        this.checkResult.set(res.data);
      },
      error: (err) => {
        this.isChecking.set(false);
        console.error('Error al verificar permiso:', err);
      },
    });
  }

  anularFactura() {
    if (!this.checkResult()?.hasPermission) return;

    this.actionFeedback.set(
      '✅ ¡Factura #FAC-2026-0042 anulada con éxito! La acción fue autorizada por el permiso FACTURA_ANULAR.'
    );
  }
}
