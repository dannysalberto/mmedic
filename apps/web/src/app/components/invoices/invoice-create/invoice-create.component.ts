import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HeaderComponent } from '../../header/header.component';
import { InvoicesService } from '../../../services/invoices.service';
import { NotificationService } from '../../../services/notification.service';
import { CustomerInlineFormComponent } from '../customer-inline-form/customer-inline-form.component';
import { InvoiceItemsTableComponent, InvoiceItemRowState } from '../invoice-items-table/invoice-items-table.component';
import { InvoicePaymentSectionComponent } from '../invoice-payment-section/invoice-payment-section.component';
import { InvoicePreviewModalComponent } from '../invoice-preview-modal/invoice-preview-modal.component';
import {
  Customer,
  CreateInvoiceDto,
  CreateInvoicePaymentDto,
  InvoiceType,
  InvoiceWithDetails,
} from '@mmedic/types';

@Component({
  selector: 'app-invoice-create',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    HeaderComponent,
    CustomerInlineFormComponent,
    InvoiceItemsTableComponent,
    InvoicePaymentSectionComponent,
    InvoicePreviewModalComponent,
  ],
  templateUrl: './invoice-create.component.html',
  styleUrls: ['./invoice-create.component.css'],
})
export class InvoiceCreateComponent {
  private readonly invoicesService = inject(InvoicesService);
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);

  // Form State
  readonly selectedCustomer = signal<Customer | null>(null);
  readonly invoiceType = signal<InvoiceType>('CASH');
  readonly notes = signal<string>('');
  readonly items = signal<InvoiceItemRowState[]>([]);
  readonly totals = signal<{ subtotal: number; vatAmount: number; total: number }>({
    subtotal: 0,
    vatAmount: 0,
    total: 0,
  });
  readonly initialPayments = signal<CreateInvoicePaymentDto[]>([]);

  readonly isSubmitting = signal<boolean>(false);
  readonly createdInvoice = signal<InvoiceWithDetails | null>(null);

  readonly canSubmit = computed(() => {
    const hasCustomer = !!this.selectedCustomer();
    const validItems = this.items().filter((i) => i.articleId && (i.contributorId || i.entityId) && i.quantity > 0);
    const hasItems = validItems.length > 0;
    return hasCustomer && hasItems && !this.isSubmitting();
  });

  onCustomerSelected(customer: Customer): void {
    this.selectedCustomer.set(customer);
  }

  onItemsChanged(items: InvoiceItemRowState[]): void {
    this.items.set(items);
  }

  onTotalsChanged(totals: { subtotal: number; vatAmount: number; total: number }): void {
    this.totals.set(totals);
  }

  onPaymentsChanged(payments: CreateInvoicePaymentDto[]): void {
    this.initialPayments.set(payments);
  }

  submitInvoice(): void {
    if (!this.canSubmit()) return;

    const validItems = this.items()
      .filter((i) => i.articleId && (i.contributorId || i.entityId) && i.quantity > 0)
      .map((i) => ({
        articleId: i.articleId,
        contributorId: i.contributorId || undefined,
        entityId: i.entityId || undefined,
        priceType: i.priceType,
        quantity: i.quantity,
      }));

    const dto: CreateInvoiceDto = {
      customerId: this.selectedCustomer()!.id,
      type: this.invoiceType(),
      notes: this.notes().trim() || undefined,
      items: validItems,
      payments: this.initialPayments().length ? this.initialPayments() : undefined,
    };

    this.isSubmitting.set(true);
    this.invoicesService.createInvoice(dto).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        if (res.success && res.data) {
          this.notificationService.success(
            'Factura Emitida',
            `Comprobante N° ${res.data.invoiceNumber} generado exitosamente.`,
          );
          // Abrir modal de previsualización directamente
          this.createdInvoice.set(res.data);
        }
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.notificationService.error(
          'Error al emitir factura',
          err.error?.message || 'Error inesperado',
        );
      },
    });
  }

  onModalClosed(): void {
    this.createdInvoice.set(null);
    this.router.navigate(['/invoices']);
  }
}
