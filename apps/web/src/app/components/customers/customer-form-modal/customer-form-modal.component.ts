import { Component, inject, signal, input, output, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CustomersService } from '../../../services/customers.service';
import { NotificationService } from '../../../services/notification.service';
import { Customer, CreateCustomerDto, UpdateCustomerDto } from '@mmedic/types';

@Component({
  selector: 'app-customer-form-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './customer-form-modal.component.html',
  styleUrls: ['./customer-form-modal.component.css'],
})
export class CustomerFormModalComponent {
  private readonly customersService = inject(CustomersService);
  private readonly notificationService = inject(NotificationService);

  readonly isOpen = input<boolean>(false);
  readonly customerToEdit = input<Customer | null>(null);
  readonly saved = output<void>();
  readonly closeModal = output<void>();

  readonly name = signal<string>('');
  readonly taxId = signal<string>('');
  readonly email = signal<string>('');
  readonly phone = signal<string>('');
  readonly address = signal<string>('');
  readonly isSubmitting = signal<boolean>(false);
  readonly errorMessage = signal<string>('');

  constructor() {
    effect(() => {
      const customer = this.customerToEdit();
      if (customer) {
        this.name.set(customer.name || '');
        this.taxId.set(customer.taxId || '');
        this.email.set(customer.email || '');
        this.phone.set(customer.phone || '');
        this.address.set(customer.address || '');
      } else {
        this.resetForm();
      }
    });
  }

  resetForm(): void {
    this.name.set('');
    this.taxId.set('');
    this.email.set('');
    this.phone.set('');
    this.address.set('');
    this.errorMessage.set('');
    this.isSubmitting.set(false);
  }

  onClose(): void {
    this.resetForm();
    this.closeModal.emit();
  }

  onSubmit(): void {
    const nameVal = this.name().trim();
    const taxIdVal = this.taxId().trim();
    const emailVal = this.email().trim();
    const phoneVal = this.phone().trim();
    const addressVal = this.address().trim();

    if (!nameVal) {
      this.errorMessage.set('El nombre o RIF/Razón Social es obligatorio');
      return;
    }
    if (!taxIdVal) {
      this.errorMessage.set('El número de Cédula o RIF es obligatorio');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    const isEdit = !!this.customerToEdit();
    const payload = {
      name: nameVal,
      taxId: taxIdVal,
      email: emailVal || null,
      phone: phoneVal || null,
      address: addressVal || null,
    };

    const request$ = isEdit
      ? this.customersService.updateCustomer(this.customerToEdit()!.id, payload as UpdateCustomerDto)
      : this.customersService.createCustomer(payload as CreateCustomerDto);

    request$.subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        if (res.success) {
          if (isEdit) {
            this.notificationService.success(
              'Cliente actualizado',
              `Los datos de "${nameVal}" se han actualizado correctamente.`
            );
            this.saved.emit();
            // Retention on edit screen (Principle V, Section 5.4)
          } else {
            this.notificationService.success(
              'Cliente registrado',
              `El paciente/cliente "${nameVal}" ha sido registrado exitosamente.`
            );
            this.saved.emit();
            this.onClose();
          }
        }
      },
      error: (err) => {
        this.isSubmitting.set(false);
        const msg = err.error?.message || 'Error al guardar el cliente';
        this.errorMessage.set(msg);
        this.notificationService.error('Error al guardar', msg);
      },
    });
  }
}
