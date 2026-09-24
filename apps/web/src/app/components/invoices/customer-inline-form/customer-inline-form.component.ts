import { Component, Output, EventEmitter, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CustomersService } from '../../../services/customers.service';
import { NotificationService } from '../../../services/notification.service';
import { Customer, CreateCustomerDto } from '@mmedic/types';

@Component({
  selector: 'app-customer-inline-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './customer-inline-form.component.html',
  styleUrls: ['./customer-inline-form.component.css'],
})
export class CustomerInlineFormComponent {
  private readonly customersService = inject(CustomersService);
  private readonly notificationService = inject(NotificationService);

  @Output() customerSelected = new EventEmitter<Customer>();

  readonly searchTaxId = signal<string>('');
  readonly selectedCustomer = signal<Customer | null>(null);
  readonly isSearching = signal<boolean>(false);
  readonly showModal = signal<boolean>(false);
  readonly isSaving = signal<boolean>(false);

  // Modal de catálogo de clientes
  readonly showSearchModal = signal<boolean>(false);
  readonly customerList = signal<Customer[]>([]);
  readonly pickerSearchFilter = signal<string>('');
  readonly isPickerLoading = signal<boolean>(false);

  // Form fields for new customer modal
  readonly modalTaxId = signal<string>('');
  readonly modalName = signal<string>('');
  readonly modalPhone = signal<string>('');
  readonly modalAddress = signal<string>('');
  readonly modalEmail = signal<string>('');

  onSearch(): void {
    const query = this.searchTaxId().trim();
    if (!query) {
      this.openCustomerSearchModal();
      return;
    }

    this.isSearching.set(true);
    this.customersService.getCustomerByTaxId(query).subscribe({
      next: (res) => {
        this.isSearching.set(false);
        if (res.success && res.data) {
          this.selectedCustomer.set(res.data);
          this.customerSelected.emit(res.data);
          this.notificationService.success('Cliente encontrado', res.data.name);
        } else {
          this.notificationService.info(
            'Cliente no encontrado',
            'No se encontró ningún cliente con ese RIF. Abriendo catálogo/registro...',
          );
          this.openCustomerSearchModal(query);
        }
      },
      error: () => {
        this.isSearching.set(false);
        this.openCustomerSearchModal(query);
      },
    });
  }

  openCustomerSearchModal(initialQuery = ''): void {
    this.pickerSearchFilter.set(initialQuery);
    this.showSearchModal.set(true);
    this.loadCustomersForPicker(initialQuery);
  }

  closeCustomerSearchModal(): void {
    this.showSearchModal.set(false);
  }

  loadCustomersForPicker(query = ''): void {
    this.isPickerLoading.set(true);
    this.customersService.getCustomers(query).subscribe({
      next: (res) => {
        this.isPickerLoading.set(false);
        if (res.success && res.data) {
          this.customerList.set(res.data);
        }
      },
      error: () => {
        this.isPickerLoading.set(false);
      },
    });
  }

  selectCustomerFromPicker(c: Customer): void {
    this.selectedCustomer.set(c);
    this.customerSelected.emit(c);
    this.showSearchModal.set(false);
    this.notificationService.success('Cliente seleccionado', c.name);
  }

  openCreateModal(initialTaxId = ''): void {
    this.modalTaxId.set(initialTaxId || this.searchTaxId());
    this.modalName.set('');
    this.modalPhone.set('');
    this.modalAddress.set('');
    this.modalEmail.set('');
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  saveCustomer(): void {
    const taxId = this.modalTaxId().trim();
    const name = this.modalName().trim();
    const phone = this.modalPhone().trim();
    const address = this.modalAddress().trim();

    if (!taxId || !name || !phone || !address) {
      this.notificationService.error('Campos incompletos', 'RIF, Nombre, Teléfono y Dirección son obligatorios.');
      return;
    }

    const dto: CreateCustomerDto = {
      taxId,
      name,
      phone,
      address,
      email: this.modalEmail().trim() || undefined,
    };

    this.isSaving.set(true);
    this.customersService.createCustomer(dto).subscribe({
      next: (res) => {
        this.isSaving.set(false);
        if (res.success && res.data) {
          this.selectedCustomer.set(res.data);
          this.customerSelected.emit(res.data);
          this.showModal.set(false);
          this.notificationService.success('Cliente registrado', `Asociado: ${res.data.name}`);
        }
      },
      error: (err) => {
        this.isSaving.set(false);
        this.notificationService.error('Error al registrar cliente', err.error?.message || 'Error inesperado');
      },
    });
  }

  clearSelection(): void {
    this.selectedCustomer.set(null);
    this.searchTaxId.set('');
  }
}
