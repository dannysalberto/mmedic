import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CustomersService } from '../../../services/customers.service';
import { NotificationService } from '../../../services/notification.service';
import { CustomerFormModalComponent } from '../customer-form-modal/customer-form-modal.component';
import { HeaderComponent } from '../../header/header.component';
import { Customer } from '@mmedic/types';

@Component({
  selector: 'app-customers-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HeaderComponent,
    CustomerFormModalComponent,
  ],
  templateUrl: './customers-list.component.html',
  styleUrls: ['./customers-list.component.css'],
})
export class CustomersListComponent implements OnInit {
  private readonly customersService = inject(CustomersService);
  private readonly notificationService = inject(NotificationService);

  readonly searchTerm = signal<string>('');

  readonly customers = this.customersService.customers;
  readonly isLoading = this.customersService.loading;

  // Modal State
  readonly isFormModalOpen = signal<boolean>(false);
  readonly selectedCustomerForEdit = signal<Customer | null>(null);

  // Safe Delete Modal State
  readonly customerToDelete = signal<Customer | null>(null);
  readonly isDeleting = signal<boolean>(false);

  ngOnInit(): void {
    this.fetchCustomers();
  }

  fetchCustomers(): void {
    this.customersService.getCustomers(this.searchTerm()).subscribe();
  }

  onSearchChange(): void {
    this.fetchCustomers();
  }

  openCreateModal(): void {
    this.selectedCustomerForEdit.set(null);
    this.isFormModalOpen.set(true);
  }

  openEditModal(customer: Customer): void {
    this.selectedCustomerForEdit.set(customer);
    this.isFormModalOpen.set(true);
  }

  closeFormModal(): void {
    this.isFormModalOpen.set(false);
    this.selectedCustomerForEdit.set(null);
  }

  onCustomerSaved(): void {
    this.fetchCustomers();
  }

  promptDelete(customer: Customer): void {
    this.customerToDelete.set(customer);
  }

  cancelDelete(): void {
    this.customerToDelete.set(null);
    this.isDeleting.set(false);
  }

  confirmDelete(): void {
    const customer = this.customerToDelete();
    if (!customer) return;

    this.isDeleting.set(true);
    this.customersService.deleteCustomer(customer.id).subscribe({
      next: (res) => {
        this.isDeleting.set(false);
        if (res.success) {
          this.notificationService.success(
            'Cliente eliminado',
            `El cliente "${customer.name}" ha sido eliminado exitosamente.`
          );
          this.cancelDelete();
        }
      },
      error: (err) => {
        this.isDeleting.set(false);
        const msg =
          err.status === 409
            ? `No se puede eliminar el cliente "${customer.name}" porque tiene facturas registradas a su nombre. Desasocie las facturas antes de intentar eliminar.`
            : err.error?.message || 'Error al eliminar el cliente';
        this.notificationService.error('Eliminación bloqueada', msg);
        this.cancelDelete();
      },
    });
  }
}
